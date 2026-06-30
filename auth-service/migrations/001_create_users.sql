CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  nome_completo VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,
  cpf         VARCHAR(14),
  tipo        VARCHAR(10) NOT NULL DEFAULT 'comum' CHECK (tipo IN ('advogado', 'comum')),
  oab_numero  VARCHAR(50),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) UNIQUE NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);
