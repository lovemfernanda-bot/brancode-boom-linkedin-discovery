import { Hono } from "hono";

interface Env {
  // D1Database will be added here once the database is wired up.
}

const app = new Hono<{ Bindings: Env }>();

/**
 * PHASE 1 STUB: accepts a submission and confirms receipt, but does not
 * persist it anywhere yet. Cloudflare D1 storage is wired up in the next
 * phase, once the frontend and content are approved.
 */
app.post("/api/submit", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body !== "object" || !body.form_slug || !body.answers) {
    return c.json({ ok: false, error: "Invalid submission payload." }, 400);
  }

  console.log("[stub submission received]", {
    form_slug: body.form_slug,
    form_version: body.form_version,
    client_name: body.client_name,
    answerCount: Object.keys(body.answers ?? {}).length,
  });

  return c.json({ ok: true, stored: false, note: "D1 storage not yet connected." });
});

export default app;
