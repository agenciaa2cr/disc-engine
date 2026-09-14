-- DISC 2.0 — schema isolado no namespace `disc`, para conviver no mesmo
-- Postgres do Supabase já em uso na VPS sem colidir com as tabelas do
-- Supabase (auth, storage etc.) nem com outro projeto que use o schema
-- `public`.
--
-- Este arquivo NÃO foi executado contra o banco de produção. Rode-o você
-- mesmo (ou aplique via migration) depois de rotacionar a senha do
-- Postgres exposta no .env atual — ver a seção de segurança da proposta.

CREATE SCHEMA IF NOT EXISTS disc;

CREATE TABLE IF NOT EXISTS disc.sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           text,
  candidate_name   text,
  job_target       jsonb,             -- { roleName, profile: {D,I,S,C}, weights? }
  created_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz
);

CREATE TABLE IF NOT EXISTS disc.tetrad_responses (
  session_id    uuid NOT NULL REFERENCES disc.sessions(id) ON DELETE CASCADE,
  pass          text NOT NULL CHECK (pass IN ('adapted', 'natural')),
  block_id      text NOT NULL,
  most          char(1) NOT NULL CHECK (most IN ('D', 'I', 'S', 'C')),
  least         char(1) NOT NULL CHECK (least IN ('D', 'I', 'S', 'C')),
  response_ms   integer,
  answered_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, pass, block_id),
  CHECK (most <> least)
);

CREATE TABLE IF NOT EXISTS disc.anchor_responses (
  session_id  uuid NOT NULL REFERENCES disc.sessions(id) ON DELETE CASCADE,
  item_id     text NOT NULL,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  answered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, item_id)
);

-- Laudos ficam persistidos como o JSON já composto (não só os fatos), para
-- que um laudo consultado depois seja bit-a-bit o que foi emitido na hora
-- — mesmo que a biblioteca de conteúdo evolua depois. engine_version e
-- content_library_version (dentro de report_json) são o que permite provar
-- isso numa eventual contestação (ver LGPD art. 20 na proposta).
CREATE TABLE IF NOT EXISTS disc.reports (
  session_id                uuid NOT NULL REFERENCES disc.sessions(id) ON DELETE CASCADE,
  audience                  text NOT NULL CHECK (audience IN ('candidato', 'recrutador', 'gestor', 'equipe')),
  generated_at              timestamptz NOT NULL DEFAULT now(),
  engine_version            text NOT NULL,
  content_library_version   text NOT NULL,
  report_json               jsonb NOT NULL,
  PRIMARY KEY (session_id, audience)
);

-- Trilha de auditoria de acesso a laudo — quem viu, quando, com que
-- finalidade. Referenciado na seção de conformidade da proposta.
CREATE TABLE IF NOT EXISTS disc.report_access_log (
  id           bigserial PRIMARY KEY,
  session_id   uuid NOT NULL REFERENCES disc.sessions(id) ON DELETE CASCADE,
  audience     text NOT NULL,
  accessed_by  text,              -- id ou e-mail de quem acessou; nulo = acesso do próprio candidato
  accessed_at  timestamptz NOT NULL DEFAULT now(),
  purpose      text
);

CREATE INDEX IF NOT EXISTS idx_disc_sessions_org ON disc.sessions (org_id);
CREATE INDEX IF NOT EXISTS idx_disc_report_access_session ON disc.report_access_log (session_id);
