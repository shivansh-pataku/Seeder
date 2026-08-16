import mysql from 'mysql2/promise'

console.log('Accessing database connection pool...')

// Use global cache to prevent connection pool leaks in development hot-reloads
let dbConfig;

if (!global.mysqlPool) {
  console.log('Creating new database connection pool...')
  global.mysqlPool = mysql.createPool({
    // Gets configuration from .env.local file
    host: process.env.DB_HOST || 'localhost',        
    user: process.env.DB_USER || 'root',        
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'practicals',   
    port: process.env.DB_PORT || 3306,  
    waitForConnections: true,
    connectionLimit: 2,  // Limit to 2 connections for development/testing
    queueLimit: 0,
    charset: 'utf8mb4',      // Full UTF-8 support including emojis
    // SSL/TLS for TiDB Cloud (required for TiDB, safe for local MySQL too)
    ssl: process.env.DB_HOST?.includes('tidbcloud.com') ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true 
    } : false
  })
  console.log('Database pool created successfully')

  // Test connection on startup once
  global.mysqlPool.getConnection()
    .then(connection => {
      console.log('Database connection test successful')
      connection.release()
    })
    .catch(err => {
      console.error('Database connection failed:', err.message)
    })
}

dbConfig = global.mysqlPool

export default dbConfig