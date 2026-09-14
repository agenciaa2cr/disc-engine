import { randomUUID } from "node:crypto";
import { getPool, isDatabaseConfigured } from "../store/db.js";
import type { SurveyResponseInput } from "./types.js";

/**
 * Armazenamento das respostas de pesquisa — deliberadamente FORA da
 * tabela genérica `hr.entities`: essas linhas nunca podem carregar um
 * personId, e mantê-las numa tabela própria (ver db/schema.sql,
 * hr.survey_responses) torna essa garantia estrutural, visível em
 * qualquer auditoria do schema, em vez de depender de disciplina de
 * código para nunca escrever esse campo.
 */
export interface SurveyResponseStore {
  submit(orgId: string, input: SurveyResponseInput): Promise<void>;
  listForSurvey(orgId: string, surveyId: string): Promise<SurveyResponseInput[]>;
  listForSegment(orgId: string, surveyId: string, segment: string): Promise<SurveyResponseInput[]>;
}

export class MemorySurveyResponseStore implements SurveyResponseStore {
  private rows: Array<{ orgId: string } & SurveyResponseInput> = [];

  async submit(orgId: string, input: SurveyResponseInput): Promise<void> {
    this.rows.push({ orgId, ...input });
  }

  async listForSurvey(orgId: string, surveyId: string): Promise<SurveyResponseInput[]> {
    return this.rows.filter((r) => r.orgId === orgId && r.surveyId === surveyId);
  }

  async listForSegment(orgId: string, surveyId: string, segment: string): Promise<SurveyResponseInput[]> {
    return this.rows.filter((r) => r.orgId === orgId && r.surveyId === surveyId && r.segment === segment);
  }
}

export class PgSurveyResponseStore implements SurveyResponseStore {
  async submit(orgId: string, input: SurveyResponseInput): Promise<void> {
    const pool = getPool();
    await pool.query(`INSERT INTO hr.survey_responses (id, org_id, survey_id, segment, answers) VALUES ($1, $2, $3, $4, $5)`, [
      randomUUID(),
      orgId,
      input.surveyId,
      input.segment ?? null,
      JSON.stringify(input.answers),
    ]);
  }

  async listForSurvey(orgId: string, surveyId: string): Promise<SurveyResponseInput[]> {
    const pool = getPool();
    const result = await pool.query(`SELECT survey_id, segment, answers FROM hr.survey_responses WHERE org_id = $1 AND survey_id = $2`, [orgId, surveyId]);
    return result.rows.map((r) => ({ surveyId: r.survey_id, segment: r.segment ?? undefined, answers: r.answers }));
  }

  async listForSegment(orgId: string, surveyId: string, segment: string): Promise<SurveyResponseInput[]> {
    const pool = getPool();
    const result = await pool.query(`SELECT survey_id, segment, answers FROM hr.survey_responses WHERE org_id = $1 AND survey_id = $2 AND segment = $3`, [
      orgId,
      surveyId,
      segment,
    ]);
    return result.rows.map((r) => ({ surveyId: r.survey_id, segment: r.segment ?? undefined, answers: r.answers }));
  }
}

export function createSurveyResponseStore(): SurveyResponseStore {
  return isDatabaseConfigured() ? new PgSurveyResponseStore() : new MemorySurveyResponseStore();
}
