-- BranCode OS V1 — submission management (review status + soft delete).
-- Purely additive: does not touch existing rows or the 0001 migration.
ALTER TABLE submissions ADD COLUMN status TEXT NOT NULL DEFAULT 'nuevo';
ALTER TABLE submissions ADD COLUMN reviewed_at TEXT;
ALTER TABLE submissions ADD COLUMN deleted_at TEXT;
ALTER TABLE submissions ADD COLUMN deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_submissions_active
  ON submissions (form_slug, deleted_at, created_at DESC);
