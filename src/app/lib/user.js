
import dbConfig from './db.js'
import bcrypt from 'bcryptjs'

export class UserService {
  
  static async findByEmail(email) {
    try {
      console.log('Searching for user:', email)
      
      const [users] = await dbConfig.execute(
        'SELECT userid, username, email, password FROM users WHERE email = ?',
        [email]
      )
      
      if (users.length === 0) {
        console.log('User not found')
        return null
      }
      
      console.log('User found:', users[0].email)
      return users[0]
      
    } catch (error) {
      console.error('Database error:', error)
      throw new Error('Database query failed')
    }
  }
  
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      console.log('Verifying password...')
      const isValid = await bcrypt.compare(plainPassword, hashedPassword)
      console.log('Password valid:', isValid)
      return isValid
    } catch (error) {
      console.error('Password verification error:', error)
      return false
    }
  }
  
  static async createUser(userData) {
    try {
      const { username, email, password } = userData
      
      // Hash password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      
      console.log('👤 Creating new user:', email)
      
      const [result] = await dbConfig.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      )
      
      console.log('User created with ID:', result.insertId)
      return result.insertId
      
    } catch (error) {
      console.error('User creation error:', error)
      throw new Error('Failed to create user')
    }
  }
}