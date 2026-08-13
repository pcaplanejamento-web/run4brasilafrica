-- Métricas do site: acessos, downloads e downloads por atleta.
-- Idempotente. As tabelas também são criadas em runtime (CREATE TABLE IF NOT EXISTS
-- em src/app/api/metrics/route.ts), então este arquivo é opcional/documental —
-- aplique com:
--   npx wrangler d1 execute run4brasilafrica-content --remote --file migrations/0005_metrics.sql

CREATE TABLE IF NOT EXISTS metric_counters (
  key   TEXT PRIMARY KEY,          -- 'visits' | 'downloads'
  count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metric_daily (
  day   TEXT NOT NULL,             -- YYYY-MM-DD (UTC)
  kind  TEXT NOT NULL,             -- 'visit' | 'download'
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
);

CREATE TABLE IF NOT EXISTS athlete_downloads (
  akey     TEXT PRIMARY KEY,       -- identidade normalizada (nº ou nome | categoria)
  name     TEXT NOT NULL,
  bib      TEXT,
  category TEXT,
  count    INTEGER NOT NULL DEFAULT 0,
  last_at  INTEGER NOT NULL        -- epoch ms do último download
);
