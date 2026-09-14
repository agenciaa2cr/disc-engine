import pg from "pg";

/**
 * Pool do Postgres, configurado pelas MESMAS variáveis de ambiente que o
 * docker-compose.yml do projeto `disc` original já usava (PG_HOST,
 * PG_PORT, PG_USER, PG_PASSWORD) — a troca é um drop-in, não pede migrar
 * convenção. PG_DATABASE tem default "postgres" porque é o banco padrão
 * do container supabase-db já em produção na VPS.
 *
 * Se PG_HOST não estiver definido, o servidor sobe mesmo assim com um
 * armazenamento em memória (ver store.ts) — útil para `npm run server`
 * local sem depender de banco.
 */
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
