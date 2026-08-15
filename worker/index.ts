import { Hono } from "hono";
import { boomBalloonsQuestionnaire } from "../src/content/boomBalloonsQuestionnaire";
import { FORM_SLUG } from "../src/content/formMeta";
import { isAnswered } from "../src/content/validate";
import type { Answers } from "../src/content/types";
import { insertSubmission, listSubmissions } from "./submissions";
import { renderAdminPage } from "./admin-page";

interface Env {
  DB: D1Database;
}

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

app.get("/api/admin/submissions", async (c) => {
  try {
    const rows = await listSubmissions(c.env.DB, FORM_SLUG);
    const submissions = rows.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      client_name: row.client_name,
      contact_email: row.contact_email,
      answers: JSON.parse(row.answers) as Answers,
    }));
    return c.json({ ok: true, submissions });
  } catch (error) {
    console.error("Failed to list submissions", error);
    return c.json({ ok: false, error: "No se pudieron cargar las respuestas." }, 500);
  }
});

app.get("/admin", (c) => c.html(renderAdminPage()));

export default app;
