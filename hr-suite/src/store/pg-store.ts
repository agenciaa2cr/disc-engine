import { getPool } from "./db.js";
import { newId, type Entity, type EntityQuery, type EntityStore } from "./entity.js";

interface Row {
  id: string;
  org_id: string;
  type: string;
  data: unknown;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toEntity<T>(row: Row): Entity<T> {
  const e: Entity<T> = {
    id: row.id,
    orgId: row.org_id,
    type: row.type,
    data: row.data as T,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.deleted_at) e.deletedAt = row.deleted_at;
  return e;
}

/** Armazenamento em Postgres — tabela única `hr.entities`, ver db/schema.sql. */
export class PgEntityStore implements EntityStore {
  async create<T>(orgId: string, type: string, data: T, id?: string): Promise<Entity<T>> {
    const pool = getPool();
    const rowId = id ?? newId();
    const result = await pool.query<Row>(
      `INSERT INTO hr.entities (id, org_id, type, data) VALUES ($1, $2, $3, $4) RETURNING *`,
      [rowId, orgId, type, JSON.stringify(data)],
    );
    return toEntity<T>(result.rows[0]!);
  }

  async get<T>(id: string): Promise<Entity<T> | undefined> {
    const pool = getPool();
    const result = await pool.query<Row>(`SELECT * FROM hr.entities WHERE id = $1`, [id]);
    return result.rows[0] ? toEntity<T>(result.rows[0]) : undefined;
  }

  async update<T>(id: string, patchData: Partial<T>): Promise<Entity<T> | undefined> {
    const pool = getPool();
    const result = await pool.query<Row>(
      `UPDATE hr.entities SET data = data || $2::jsonb, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, JSON.stringify(patchData)],
    );
    return result.rows[0] ? toEntity<T>(result.rows[0]) : undefined;
  }

  async replace<T>(id: string, data: T): Promise<Entity<T> | undefined> {
    const pool = getPool();
    const result = await pool.query<Row>(
      `UPDATE hr.entities SET data = $2::jsonb, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, JSON.stringify(data)],
    );
    return result.rows[0] ? toEntity<T>(result.rows[0]) : undefined;
  }

  async softDelete(id: string): Promise<void> {
    const pool = getPool();
    await pool.query(`UPDATE hr.entities SET deleted_at = now() WHERE id = $1`, [id]);
  }

  async list<T>(query: EntityQuery): Promise<Entity<T>[]> {
    const pool = getPool();
    const conditions = ["org_id = $1", "type = $2"];
    const params: unknown[] = [query.orgId, query.type];
    if (!query.includeDeleted) conditions.push("deleted_at IS NULL");
    if (query.where) {
      let i = params.length;
      for (const [k, v] of Object.entries(query.where)) {
        // nome de campo vem sempre do nosso próprio código (nunca de input
        // de usuário repassado direto), mas sanitiza mesmo assim — só
        // permite o que uma chave de objeto JS legítima usaria.
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) throw new Error(`nome de campo inválido em where: ${k}`);
        i += 1;
        conditions.push(`data ->> '${k}' = $${i}`);
        params.push(String(v));
      }
    }
    const result = await pool.query<Row>(
      `SELECT * FROM hr.entities WHERE ${conditions.join(" AND ")} ORDER BY created_at ASC`,
      params,
    );
    return result.rows.map((r) => toEntity<T>(r));
  }
}
