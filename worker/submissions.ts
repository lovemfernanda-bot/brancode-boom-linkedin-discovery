import type { Answers } from "../src/content/types";

export interface SubmissionRow {
  id: string;
  created_at: string;
  form_slug: string;
  form_version: number;
  client_name: string;
  contact_email: string | null;
  answers: string;
}

export interface NewSubmission {
  form_slug: string;
  form_version: number;
  client_name: string;
  contact_email: string | null;
  answers: Answers;
}

export async function insertSubmission(db: D1Database, submission: NewSubmission): Promise<string> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO submissions (id, created_at, form_slug, form_version, client_name, contact_email, answers)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      createdAt,
      submission.form_slug,
      submission.form_version,
      submission.client_name,
      submission.contact_email,
      JSON.stringify(submission.answers),
    )
    .run();

  return id;
}

export async function listSubmissions(db: D1Database, formSlug: string, limit = 200): Promise<SubmissionRow[]> {
  const result = await db
    .prepare(
      `SELECT id, created_at, form_slug, form_version, client_name, contact_email, answers
       FROM submissions
       WHERE form_slug = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(formSlug, limit)
    .all<SubmissionRow>();

  return result.results ?? [];
}
