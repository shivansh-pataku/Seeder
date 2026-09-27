// src/app/lib/db.js
// Re-export pool from db.ts for seamless backward compatibility across JS files
import pool, { withTransaction } from './db.ts';

export { withTransaction };
export default pool;