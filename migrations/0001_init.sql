-- Boom Balloons Miami LinkedIn Discovery — submissions table.
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  form_slug TEXT NOT NULL,
  form_version INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  contact_email TEXT,
  answers TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_form_slug_created_at
  ON submissions (form_slug, created_at DESC);
