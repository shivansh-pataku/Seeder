// scripts/run_migration.mjs
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  console.log('Connecting to MySQL database:', process.env.DB_NAME || 'MAJOR');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'MAJOR',
      port: Number(process.env.DB_PORT) || 3306,
      multipleStatements: true,
    });

    console.log('Connected to MySQL successfully!');

    const sql = fs.readFileSync('src/app/lib/migration_v1_stories_likes_folders.sql', 'utf8');

    console.log('Executing migration script...');
    await connection.query(sql);

    console.log('Migration executed successfully!');

    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', tables);

    await connection.end();
  } catch (err) {
    console.error('Migration notice/error:', err.message);
  }
}

run();
