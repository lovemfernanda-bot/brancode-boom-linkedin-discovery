import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { isAnswered } from "../src/content/validate";
import type { Answers } from "../src/content/types";
import {
  insertSubmission,
  listSubmissions,
  permanentlyDeleteSubmission,
  restoreSubmission,
  softDeleteSubmission,
  updateSubmissionStatus,
  type SubmissionStatus,
} from "./submissions";
import {
  createForm,
  getFormById,
  getFormBySlug,
  listForms,
  normalizeQuestions,
  updateForm,
  validateFormInput,
  type FormStatus,
} from "./forms";
import { AiGenerationError, generateFormFromText } from "./ai";
import { renderAdminLoginPage, renderAdminPage } from "./admin-page";
import { SESSION_COOKIE_NAME, createSessionToken, verifyCredentials, verifySessionToken } from "./auth";

interface Env {
  DB: D1Database;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  AI: Ai;
  ASSETS: Fetcher;
}

type AppContext = Context<{ Bindings: Env }>;

const app = new Hono<{ Bindings: Env }>();

// --- Public: form definition + submission. No auth. ---

app.get("/api/forms/:slug", async (c) => {
  const form = await getFormBySlug(c.env.DB, c.req.param("slug"));
  if (!form || form.status !== "activo") {
    return c.json({ ok: false, error: "Formulario no encontrado." }, 404);
  }
  return c.json({
    ok: true,
    form: { slug: form.slug, name: form.name, clientName: form.clientName, questions: form.questions },
  });
});

interface SubmitPayload {
  form_slug?: unknown;
  contact_email?: unknown;
  answers?: unknown;
}

app.post("/api/submit", async (c) => {
  const body = await c.req.json<SubmitPayload>().catch(() => null);
  if (!body || typeof body.form_slug !== "string") {
    return c.json({ ok: false, error: "Cuerpo de la solicitud inválido." }, 400);
  }

  const form = await getFormBySlug(c.env.DB, body.form_slug);
  if (!form || form.status !== "activo") {
    return c.json({ ok: false, error: "Formulario no encontrado o inactivo." }, 404);
  }

  if (typeof body.answers !== "object" || body.answers === null) {
    return c.json({ ok: false, error: "answers inválido." }, 400);
  }
  const answers = body.answers as Answers;
  for (const question of form.questions) {
    if (!isAnswered(question, answers[question.id])) {
      return c.json({ ok: false, error: `Falta responder una pregunta obligatoria (${question.id}).` }, 400);
    }
  }

  const contactEmail =
    typeof body.contact_email === "string" && body.contact_email.trim().length > 0
      ? body.contact_email.trim()
      : null;

  try {
    const id = await insertSubmission(c.env.DB, {
      form_slug: form.slug,
      form_version: 1,
      client_name: form.clientName,
      contact_email: contactEmail,
      answers,
    });
    return c.json({ ok: true, id }, 201);
  } catch (error) {
    console.error("Failed to store submission", error);
    return c.json({ ok: false, error: "No se pudo guardar la respuesta. Inténtalo de nuevo." }, 500);
  }
});

// --- Admin auth ---

async function isAuthenticated(c: AppContext): Promise<boolean> {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  return verifySessionToken(c.env, token);
}

/**
 * Lightweight CSRF defense on top of the SameSite=Strict session cookie:
 * state-changing admin requests must carry an Origin (or, failing that,
 * Referer) header matching this Worker's own host. Requests with neither
 * header are rejected rather than assumed safe.
 */
function isSameOrigin(c: AppContext): boolean {
  const requestHost = new URL(c.req.url).host;
  const origin = c.req.header("Origin");
  if (origin) {
    try {
      return new URL(origin).host === requestHost;
    } catch {
      return false;
    }
  }
  const referer = c.req.header("Referer");
  if (referer) {
    try {
      return new URL(referer).host === requestHost;
    } catch {
      return false;
    }
  }
  return false;
}

async function requireAuthenticatedMutation(c: AppContext): Promise<boolean> {
  if (!(await isAuthenticated(c))) return false;
  if (!isSameOrigin(c)) return false;
  return true;
}

function setSessionCookie(c: AppContext, token: string, maxAge: number) {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge,
  });
}

app.post("/api/admin/login", async (c) => {
  const body = await c.req.json<{ username?: unknown; password?: unknown }>().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password || !verifyCredentials(c.env, username, password)) {
    return c.json({ ok: false, error: "Usuario o contraseña incorrectos." }, 401);
  }

  const { token, maxAge } = await createSessionToken(c.env);
  setSessionCookie(c, token, maxAge);
  return c.json({ ok: true });
});

app.post("/api/admin/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/admin/me", async (c) => {
  if (!(await isAuthenticated(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }
  return c.json({ ok: true, username: c.env.ADMIN_USERNAME });
});

// --- Everything below this line requires a valid admin session. ---

app.get("/api/admin/submissions", async (c) => {
  if (!(await isAuthenticated(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const trashed = c.req.query("trashed") === "true";
  const formSlug = c.req.query("form_slug") || undefined;

  try {
    const rows = await listSubmissions(c.env.DB, { trashed, formSlug });
    const submissions = rows.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      form_slug: row.form_slug,
      form_version: row.form_version,
      client_name: row.client_name,
      contact_email: row.contact_email,
      status: row.status,
      reviewed_at: row.reviewed_at,
      deleted_at: row.deleted_at,
      answers: JSON.parse(row.answers) as Answers,
    }));
    return c.json({ ok: true, submissions });
  } catch (error) {
    console.error("Failed to list submissions", error);
    return c.json({ ok: false, error: "No se pudieron cargar las respuestas." }, 500);
  }
});

app.post("/api/admin/submissions/:id/status", async (c) => {
  if (!(await requireAuthenticatedMutation(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const id = c.req.param("id");
  const body = await c.req.json<{ status?: unknown }>().catch(() => null);
  const status = body?.status;
  if (status !== "nuevo" && status !== "revisado") {
    return c.json({ ok: false, error: "Estado inválido." }, 400);
  }

  const changed = await updateSubmissionStatus(c.env.DB, id, status as SubmissionStatus);
  if (!changed) {
    return c.json({ ok: false, error: "No se encontró la respuesta." }, 404);
  }
  return c.json({ ok: true });
});

app.post("/api/admin/submissions/:id/delete", async (c) => {
  if (!(await requireAuthenticatedMutation(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const id = c.req.param("id");
  const changed = await softDeleteSubmission(c.env.DB, id, "admin");
  if (!changed) {
    return c.json({ ok: false, error: "No se encontró la respuesta activa." }, 404);
  }
  return c.json({ ok: true });
});

app.post("/api/admin/submissions/:id/restore", async (c) => {
  if (!(await requireAuthenticatedMutation(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const id = c.req.param("id");
  const changed = await restoreSubmission(c.env.DB, id);
  if (!changed) {
    return c.json({ ok: false, error: "No se encontró la respuesta en la papelera." }, 404);
  }
  return c.json({ ok: true });
});

app.delete("/api/admin/submissions/:id", async (c) => {
  if (!(await requireAuthenticatedMutation(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const id = c.req.param("id");
  // permanentlyDeleteSubmission only ever removes rows that are already
  // soft-deleted (deleted_at IS NOT NULL) — enforced in the SQL itself.
  const changed = await permanentlyDeleteSubmission(c.env.DB, id);
  if (!changed) {
    return c.json(
      { ok: false, error: "Solo se pueden eliminar permanentemente respuestas que ya estén en la papelera." },
      404,
    );
  }
  return c.json({ ok: true });
});

// --- Admin: form management ---

app.get("/api/admin/forms", async (c) => {
  if (!(await isAuthenticated(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }
  try {
    const forms = await listForms(c.env.DB);
    return c.json({ ok: true, forms });
  } catch (error) {
    console.error("Failed to list forms", error);
    return c.json({ ok: false, error: "No se pudieron cargar los formularios." }, 500);
  }
});

interface FormPayload {
  name?: unknown;
  clientName?: unknown;
  questions?: unknown[];
  status?: unknown;
}

app.post("/api/admin/forms", async (c) => {
  if (!(await requireAuthenticatedMutation(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const body = await c.req.json<FormPayload>().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Cuerpo de la solicitud inválido." }, 400);

  const questions = normalizeQuestions(Array.isArray(body.questions) ? body.questions : []);
  const validationError = validateFormInput({ name: body.name, clientName: body.clientName, questions });
  if (validationError) {
    return c.json({ ok: false, error: validationError }, 400);
  }

  try {
    const form = await createForm(c.env.DB, {
      name: body.name as string,
      clientName: body.clientName as string,
      questions,
    });
    return c.json({ ok: true, form }, 201);
  } catch (error) {
    console.error("Failed to create form", error);
    return c.json({ ok: false, error: "No se pudo crear el formulario." }, 500);
  }
});

app.patch("/api/admin/forms/:id", async (c) => {
  if (!(await requireAuthenticatedMutation(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const id = c.req.param("id");
  const existing = await getFormById(c.env.DB, id);
  if (!existing) {
    return c.json({ ok: false, error: "No se encontró el formulario." }, 404);
  }

  const body = await c.req.json<FormPayload>().catch(() => null);
  if (!body) return c.json({ ok: false, error: "Cuerpo de la solicitud inválido." }, 400);

  const questions = normalizeQuestions(Array.isArray(body.questions) ? body.questions : []);
  const validationError = validateFormInput({ name: body.name, clientName: body.clientName, questions });
  if (validationError) {
    return c.json({ ok: false, error: validationError }, 400);
  }
  const status: FormStatus = body.status === "inactivo" ? "inactivo" : "activo";

  try {
    await updateForm(c.env.DB, id, {
      name: body.name as string,
      clientName: body.clientName as string,
      questions,
      status,
    });
    return c.json({ ok: true });
  } catch (error) {
    console.error("Failed to update form", error);
    return c.json({ ok: false, error: "No se pudo actualizar el formulario." }, 500);
  }
});

app.post("/api/admin/forms/generate", async (c) => {
  if (!(await requireAuthenticatedMutation(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const body = await c.req.json<{ text?: unknown }>().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";

  try {
    const draft = await generateFormFromText(c.env.AI, text);
    return c.json({ ok: true, ...draft });
  } catch (error) {
    // Only AiGenerationError carries a message meant for the admin to see —
    // anything else (e.g. an unexpected internal error) is logged and
    // replaced with a generic message so internals are never leaked.
    if (error instanceof AiGenerationError) {
      return c.json({ ok: false, error: error.message }, 422);
    }
    console.error("Unexpected error generating form with AI", error);
    return c.json({ ok: false, error: "No se pudo generar el formulario con IA." }, 500);
  }
});

async function renderAdminEntry(c: AppContext) {
  if (!(await isAuthenticated(c))) {
    return c.html(renderAdminLoginPage());
  }
  return c.html(renderAdminPage());
}

app.get("/admin", renderAdminEntry);

/** True for any hostname whose first label is exactly "admin" (e.g. admin.brancode.io). */
function isAdminHost(c: AppContext): boolean {
  const host = c.req.header("host") ?? new URL(c.req.url).host;
  return host.split(".")[0] === "admin";
}

// On a dedicated admin subdomain, the root path should be the admin panel
// itself, not the public form — visiting admin.brancode.io should not
// require typing /admin at the end.
app.get("/", async (c) => {
  if (isAdminHost(c)) return renderAdminEntry(c);
  return c.env.ASSETS.fetch(c.req.raw);
});

// Anything else (e.g. /f/:slug for the public React app's client-side
// routing) isn't a route this Worker knows about — hand it to the static
// asset handler, which applies not_found_handling: "single-page-application"
// and serves index.html instead of a bare 404.
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
