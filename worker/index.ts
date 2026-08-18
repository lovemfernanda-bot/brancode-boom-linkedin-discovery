import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { boomBalloonsQuestionnaire } from "../src/content/boomBalloonsQuestionnaire";
import { FORM_SLUG } from "../src/content/formMeta";
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
import { renderAdminLoginPage, renderAdminPage } from "./admin-page";
import { SESSION_COOKIE_NAME, createSessionToken, verifyPassword, verifySessionToken } from "./auth";

interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

type AppContext = Context<{ Bindings: Env }>;

const app = new Hono<{ Bindings: Env }>();

interface SubmitPayload {
  form_slug?: unknown;
  form_version?: unknown;
  client_name?: unknown;
  contact_email?: unknown;
  answers?: unknown;
}

function validateSubmission(body: SubmitPayload): string | null {
  if (typeof body.form_slug !== "string" || body.form_slug !== FORM_SLUG) {
    return "form_slug inválido.";
  }
  if (typeof body.form_version !== "number") {
    return "form_version inválido.";
  }
  if (typeof body.client_name !== "string" || body.client_name.trim().length === 0) {
    return "client_name inválido.";
  }
  if (typeof body.answers !== "object" || body.answers === null) {
    return "answers inválido.";
  }
  const answers = body.answers as Answers;
  for (const question of boomBalloonsQuestionnaire) {
    if (!isAnswered(question, answers[question.id])) {
      return `Falta responder una pregunta obligatoria (${question.id}).`;
    }
  }
  return null;
}

// The public form and its submission endpoint stay unauthenticated.
app.post("/api/submit", async (c) => {
  const body = await c.req.json<SubmitPayload>().catch(() => null);
  if (!body) {
    return c.json({ ok: false, error: "Cuerpo de la solicitud inválido." }, 400);
  }

  const validationError = validateSubmission(body);
  if (validationError) {
    return c.json({ ok: false, error: validationError }, 400);
  }

  const contactEmail =
    typeof body.contact_email === "string" && body.contact_email.trim().length > 0
      ? body.contact_email.trim()
      : null;

  try {
    const id = await insertSubmission(c.env.DB, {
      form_slug: body.form_slug as string,
      form_version: body.form_version as number,
      client_name: body.client_name as string,
      contact_email: contactEmail,
      answers: body.answers as Answers,
    });
    return c.json({ ok: true, id }, 201);
  } catch (error) {
    console.error("Failed to store submission", error);
    return c.json({ ok: false, error: "No se pudo guardar la respuesta. Inténtalo de nuevo." }, 500);
  }
});

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
  const body = await c.req.json<{ password?: unknown }>().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || !verifyPassword(c.env, password)) {
    return c.json({ ok: false, error: "Contraseña incorrecta." }, 401);
  }

  const { token, maxAge } = await createSessionToken(c.env);
  setSessionCookie(c, token, maxAge);
  return c.json({ ok: true });
});

app.post("/api/admin/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});

// --- Everything below this line requires a valid admin session. ---

app.get("/api/admin/submissions", async (c) => {
  if (!(await isAuthenticated(c))) {
    return c.json({ ok: false, error: "No autorizado." }, 401);
  }

  const trashed = c.req.query("trashed") === "true";

  try {
    const rows = await listSubmissions(c.env.DB, FORM_SLUG, { trashed });
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

async function requireAuthenticatedMutation(c: AppContext): Promise<boolean> {
  if (!(await isAuthenticated(c))) return false;
  if (!isSameOrigin(c)) return false;
  return true;
}

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

app.get("/admin", async (c) => {
  if (!(await isAuthenticated(c))) {
    return c.html(renderAdminLoginPage());
  }
  return c.html(renderAdminPage());
});

export default app;
