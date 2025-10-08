import mysql from 'mysql2/promise'

console.log('Creating database connection pool...')

const dbConfig = mysql.createPool({
  // Gets configuration from .env.local file
  host: process.env.DB_HOST || 'localhost',        
  user: process.env.DB_USER || 'root',        
  password: process.env.DB_PASSWORD || '', 
  database: process.env.DB_NAME || 'practicals',   
  port: process.env.DB_PORT || 3306,  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Connection timeout settings
  //acquireTimeout: 60000,  // 60 seconds to get connection
  //timeout: 60000,         // 60 seconds for queries
  // Additional recommended settings
  reconnect: true,
  charset: 'utf8mb4'      // Full UTF-8 support including emojis
})

console.log('Database pool created successfully')

// Test connection on startup
dbConfig.getConnection()
  .then(connection => {
    console.log('Database connection test successful')
    connection.release()
  })
  .catch(err => {
    console.error('Database connection failed:', err.message)
  })

export default dbConfig