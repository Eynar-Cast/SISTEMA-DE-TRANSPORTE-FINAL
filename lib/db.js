import { Pool } from 'pg';

// Reutilizamos la conexión entre invocaciones de la función serverless
// para no abrir una conexión nueva en cada request.
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows;
}