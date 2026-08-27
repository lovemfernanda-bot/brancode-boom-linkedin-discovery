import type { Answers } from "../src/content/types";

export type SubmissionStatus = "nuevo" | "revisado";

export interface SubmissionRow {
  id: string;
  created_at: string;
  form_slug: string;
  form_version: number;
  client_name: string;
  contact_email: string | null;
  answers: string;
  status: SubmissionStatus;
  reviewed_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface NewSubmission {
  form_slug: string;
  form_version: number;
  client_name: string;
  contact_email: string | null;
  answers: Answers;
}

const SUBMISSION_COLUMNS = `id, created_at, form_slug, form_version, client_name, contact_email, answers,
  status, reviewed_at, deleted_at, deleted_by`;

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

export async function listSubmissions(
  db: D1Database,
  options: { trashed?: boolean; formSlug?: string } = {},
  limit = 500,
): Promise<SubmissionRow[]> {
  const deletedClause = options.trashed ? "deleted_at IS NOT NULL" : "deleted_at IS NULL";
  const formClause = options.formSlug ? "AND form_slug = ?" : "";
  const bindings = options.formSlug ? [options.formSlug, limit] : [limit];

  const result = await db
    .prepare(
      `SELECT ${SUBMISSION_COLUMNS}
       FROM submissions
       WHERE ${deletedClause} ${formClause}
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(...bindings)
    .all<SubmissionRow>();

  return result.results ?? [];
}

export async function getSubmissionById(db: D1Database, id: string): Promise<SubmissionRow | null> {
  const row = await db
    .prepare(`SELECT ${SUBMISSION_COLUMNS} FROM submissions WHERE id = ?`)
    .bind(id)
    .first<SubmissionRow>();
  return row ?? null;
}

export async function updateSubmissionStatus(
  db: D1Database,
  id: string,
  status: SubmissionStatus,
): Promise<boolean> {
  const reviewedAt = status === "revisado" ? new Date().toISOString() : null;
  const result = await db
    .prepare(`UPDATE submissions SET status = ?, reviewed_at = ? WHERE id = ? AND deleted_at IS NULL`)
    .bind(status, reviewedAt, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function softDeleteSubmission(db: D1Database, id: string, deletedBy: string): Promise<boolean> {
  const result = await db
    .prepare(`UPDATE submissions SET deleted_at = ?, deleted_by = ? WHERE id = ? AND deleted_at IS NULL`)
    .bind(new Date().toISOString(), deletedBy, id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function restoreSubmission(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare(`UPDATE submissions SET deleted_at = NULL, deleted_by = NULL WHERE id = ? AND deleted_at IS NOT NULL`)
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/**
 * Permanently removes a submission. The WHERE clause itself enforces that
 * only already soft-deleted rows are eligible — an active submission can
 * never be hard-deleted this way, even by calling the endpoint directly.
 */
export async function permanentlyDeleteSubmission(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM submissions WHERE id = ? AND deleted_at IS NOT NULL`)
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
