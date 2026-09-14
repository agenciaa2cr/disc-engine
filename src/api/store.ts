import { randomUUID } from "node:crypto";
import type { Audience, JobTarget, Report, SessionResponses } from "../types.js";
import { getPool, isDatabaseConfigured } from "./db.js";

export interface SessionRecord {
  id: string;
  orgId?: string;
  candidateName?: string;
  jobTarget?: JobTarget;
  createdAt: string;
}

export interface SessionStore {
  createSession(input: { orgId?: string; candidateName?: string; jobTarget?: JobTarget }): Promise<SessionRecord>;
  getSession(id: string): Promise<SessionRecord | undefined>;
  saveResponses(id: string, responses: SessionResponses): Promise<void>;
  getResponses(id: string): Promise<SessionResponses | undefined>;
  saveReport(id: string, audience: Audience, report: Report): Promise<void>;
  getReport(id: string, audience: Audience): Promise<Report | undefined>;
  logAccess(id: string, audience: Audience, accessedBy?: string, purpose?: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Armazenamento em memória — usado quando PG_HOST não está configurado.
// Não sobrevive a reinício do processo; existe para dev local e para os
// exemplos do README rodarem sem depender de um Postgres de pé.
// ---------------------------------------------------------------------------
export class MemoryStore implements SessionStore {
  private sessions = new Map<string, SessionRecord>();
  private responses = new Map<string, SessionResponses>();
  private reports = new Map<string, Partial<Record<Audience, Report>>>();

  async createSession(input: { orgId?: string; candidateName?: string; jobTarget?: JobTarget }): Promise<SessionRecord> {
    const record: SessionRecord = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
    this.sessions.set(record.id, record);
    return record;
  }

  async getSession(id: string) {
    return this.sessions.get(id);
  }

  async saveResponses(id: string, responses: SessionResponses) {
    this.responses.set(id, responses);
  }

  async getResponses(id: string) {
    return this.responses.get(id);
  }

  async saveReport(id: string, audience: Audience, report: Report) {
    const existing = this.reports.get(id) ?? {};
    existing[audience] = report;
    this.reports.set(id, existing);
  }

  async getReport(id: string, audience: Audience) {
    return this.reports.get(id)?.[audience];
  }

  async logAccess() {
    // sem persistência em memória — a trilha de auditoria real depende do Postgres
  }
}

// ---------------------------------------------------------------------------
// Armazenamento em Postgres — schema `disc`, ver db/schema.sql.
// ---------------------------------------------------------------------------
export class PgStore implements SessionStore {
  async createSession(input: { orgId?: string; candidateName?: string; jobTarget?: JobTarget }): Promise<SessionRecord> {
    const pool = getPool();
    const result = await pool.query<{ id: string; created_at: string }>(
      `INSERT INTO disc.sessions (org_id, candidate_name, job_target) VALUES ($1, $2, $3) RETURNING id, created_at`,
      [input.orgId ?? null, input.candidateName ?? null, input.jobTarget ? JSON.stringify(input.jobTarget) : null],
    );
    const row = result.rows[0]!;
    return { id: row.id, orgId: input.orgId, candidateName: input.candidateName, jobTarget: input.jobTarget, createdAt: row.created_at };
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const pool = getPool();
    const result = await pool.query(`SELECT id, org_id, candidate_name, job_target, created_at FROM disc.sessions WHERE id = $1`, [id]);
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      orgId: row.org_id ?? undefined,
      candidateName: row.candidate_name ?? undefined,
      jobTarget: row.job_target ?? undefined,
      createdAt: row.created_at,
    };
  }

  async saveResponses(id: string, responses: SessionResponses): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const pass of ["adapted", "natural"] as const) {
        for (const r of responses[pass]) {
          await client.query(
            `INSERT INTO disc.tetrad_responses (session_id, pass, block_id, most, least, response_ms)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (session_id, pass, block_id)
             DO UPDATE SET most = EXCLUDED.most, least = EXCLUDED.least, response_ms = EXCLUDED.response_ms, answered_at = now()`,
            [id, pass, r.blockId, r.most, r.least, r.responseMs ?? null],
          );
        }
      }
      for (const a of responses.anchors) {
        await client.query(
          `INSERT INTO disc.anchor_responses (session_id, item_id, rating)
           VALUES ($1, $2, $3)
           ON CONFLICT (session_id, item_id) DO UPDATE SET rating = EXCLUDED.rating, answered_at = now()`,
          [id, a.itemId, a.rating],
        );
      }
      await client.query("UPDATE disc.sessions SET completed_at = now() WHERE id = $1", [id]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getResponses(id: string): Promise<SessionResponses | undefined> {
    const pool = getPool();
    const tetrad = await pool.query(`SELECT pass, block_id, most, least, response_ms FROM disc.tetrad_responses WHERE session_id = $1`, [id]);
    if (tetrad.rows.length === 0) return undefined;
    const anchors = await pool.query(`SELECT item_id, rating FROM disc.anchor_responses WHERE session_id = $1`, [id]);

    const responses: SessionResponses = { adapted: [], natural: [], anchors: [] };
    for (const row of tetrad.rows) {
      const target = row.pass === "adapted" ? responses.adapted : responses.natural;
      target.push({ blockId: row.block_id, most: row.most, least: row.least, responseMs: row.response_ms ?? undefined });
    }
    for (const row of anchors.rows) {
      responses.anchors.push({ itemId: row.item_id, rating: row.rating });
    }
    return responses;
  }

  async saveReport(id: string, audience: Audience, report: Report): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO disc.reports (session_id, audience, engine_version, content_library_version, report_json)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, audience)
       DO UPDATE SET generated_at = now(), engine_version = EXCLUDED.engine_version,
                     content_library_version = EXCLUDED.content_library_version, report_json = EXCLUDED.report_json`,
      [id, audience, report.engineVersion, report.contentLibraryVersion, JSON.stringify(report)],
    );
  }

  async getReport(id: string, audience: Audience): Promise<Report | undefined> {
    const pool = getPool();
    const result = await pool.query(`SELECT report_json FROM disc.reports WHERE session_id = $1 AND audience = $2`, [id, audience]);
    return result.rows[0]?.report_json;
  }

  async logAccess(id: string, audience: Audience, accessedBy?: string, purpose?: string): Promise<void> {
    const pool = getPool();
    await pool.query(`INSERT INTO disc.report_access_log (session_id, audience, accessed_by, purpose) VALUES ($1, $2, $3, $4)`, [
      id,
      audience,
      accessedBy ?? null,
      purpose ?? null,
    ]);
  }
}

export function createStore(): SessionStore {
  return isDatabaseConfigured() ? new PgStore() : new MemoryStore();
}
