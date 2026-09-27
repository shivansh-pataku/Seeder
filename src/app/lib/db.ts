// src/app/lib/db.ts
import mysql, { Pool, PoolConnection } from 'mysql2/promise';

declare global {
  var mysqlPool: Pool | undefined;
}

if (!global.mysqlPool) {
  global.mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'MAJOR',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Upgraded from 2 to 10 for production concurrency
    queueLimit: 0,
    charset: 'utf8mb4',
    ssl: process.env.DB_HOST?.includes('tidbcloud.com')
      ? {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
        }
      : undefined,
  });

  // Test connection on startup
  global.mysqlPool
    .getConnection()
    .then((conn) => {
      console.log('Database connection pool established successfully (limit: 10)');
      conn.release();
    })
    .catch((err) => {
      console.error('Database pool initialization error:', err.message);
    });
}

const pool: Pool = global.mysqlPool;

/**
 * Execute a callback within an atomic ACID database transaction.
 * Automatically handles beginTransaction, commit, rollback, and connection release.
 */
export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
