-- Cadastros de "Seja um Parceiro" (pessoas/empresas que querem apoiar a causa).
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,                 -- "O que posso ajudar"
  kind TEXT NOT NULL,                    -- 'fisica' | 'juridica'
  has_whatsapp INTEGER NOT NULL DEFAULT 0, -- 0 = não, 1 = sim
  created_at TEXT NOT NULL
);
