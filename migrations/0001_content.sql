-- Single-row table holding the whole SiteContent JSON (id is always 1).
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY,
  json TEXT NOT NULL
);
