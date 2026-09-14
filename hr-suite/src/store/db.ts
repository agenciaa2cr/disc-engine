import pg from "pg";

/** Mesma convenção de variáveis de ambiente do disc-engine (PG_HOST,
 *  PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE) — os dois serviços podem
 *  apontar para o mesmo Postgres da VPS, em schemas separados (`disc` e
 *  `hr`), sem conflito. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.PG_HOST);
}

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      host: process.env.PG_HOST,
      port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
      user: process.env.PG_USER ?? "postgres",
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE ?? "postgres",
      max: 10,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
