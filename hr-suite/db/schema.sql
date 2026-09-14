-- HR Suite — schema isolado no namespace `hr`, para conviver no mesmo
-- Postgres do Supabase já em uso na VPS junto com o schema `disc` do
-- motor DISC 2.0. Não foi executado contra banco de produção — aplique
-- depois de rotacionar a senha exposta no .env do projeto antigo.
--
-- Uma tabela genérica de entidades (id, org_id, type, data jsonb), não uma
-- tabela por módulo. Ver README ("Por que uma tabela genérica de
-- entidades") para a justificativa: esta é a fase de descoberta do
-- produto, o formato de cada entidade ainda muda semana a semana, e uma
-- tabela por tipo com ALTER TABLE a cada mudança teria custo maior que o
-- ganho nesta fase. A camada de serviço em TypeScript (src/*/service.ts)
-- é quem garante forma e regra de negócio — o banco garante isolamento
-- por organização, integridade referencial de verdade onde importa
-- (pessoas, sessões DISC) e histórico de auditoria.

CREATE SCHEMA IF NOT EXISTS hr;

CREATE TABLE IF NOT EXISTS hr.entities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  type        text NOT NULL,
  data        jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_hr_entities_org_type ON hr.entities (org_id, type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_hr_entities_data_gin ON hr.entities USING gin (data);

-- Pesquisas de clima/eNPS/psicossocial: respostas ficam em tabela própria,
-- SEM coluna de pessoa/identificador — anonimato garantido pelo desenho do
-- schema, não por convenção de código. Ver src/climate/.
CREATE TABLE IF NOT EXISTS hr.survey_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  survey_id    uuid NOT NULL,
  -- grupo de recorte opcional (ex.: "departamento:engenharia") usado só
  -- para permitir corte agregado — nunca identifica uma pessoa sozinho, e
  -- a camada de agregação (src/climate/aggregate.ts) recusa expor
  -- qualquer recorte com menos de ANONYMITY_THRESHOLD respostas.
  segment      text,
  answers      jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_survey_responses_survey ON hr.survey_responses (survey_id);

-- Trilha de auditoria — quem acessou o quê. Mesmo padrão do schema `disc`.
CREATE TABLE IF NOT EXISTS hr.access_log (
  id           bigserial PRIMARY KEY,
  org_id       uuid NOT NULL,
  entity_id    uuid,
  entity_type  text,
  accessed_by  text,
  accessed_at  timestamptz NOT NULL DEFAULT now(),
  action       text NOT NULL,
  purpose      text
);
