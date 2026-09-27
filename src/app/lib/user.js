
import dbConfig from './db.js'
import bcrypt from 'bcryptjs'

export class UserService {
  
  static async findByEmail(email) {
    try {
      console.log('Searching for user:', email)
      
      const [users] = await dbConfig.execute(
        'SELECT userid, username, email, password, gender FROM users WHERE email = ?', [email] )
      
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
      
      console.log('Creating new user:', email)
      
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

  static async updatePassword(email, newPassword) {
    try {
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
      
      console.log('Updating password for:', email)
      
      const [result] = await dbConfig.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      )
      
      return result.affectedRows > 0
    } catch (error) {
      console.error('Password update error:', error)
      throw new Error('Failed to update password')
    }
  }

  static async updatePasswordById(userId, newPassword) {
    try {
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

      console.log('Updating password for user ID:', userId)

      const [result] = await dbConfig.execute(
        'UPDATE users SET password = ? WHERE userid = ?',
        [hashedPassword, userId]
      )

      return result.affectedRows > 0
    } catch (error) {
      console.error('Password update by ID error:', error)
      throw new Error('Failed to update password')
    }
  }

  static async saveResetToken(userId, tokenHash, expiresAt) {
    try {
      // Remove any existing tokens for this user first
      await dbConfig.execute(
        'DELETE FROM password_reset_tokens WHERE user_id = ?',
        [userId]
      )

      // Store new token
      await dbConfig.execute(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [userId, tokenHash, expiresAt]
      )

      return true
    } catch (error) {
      console.error('Error saving reset token:', error)
      throw new Error('Failed to save reset token')
    }
  }

  static async verifyResetToken(tokenHash) {
    try {
      const [rows] = await dbConfig.execute(
        `SELECT t.id, t.user_id, t.expires_at, u.email, u.username
         FROM password_reset_tokens t
         JOIN users u ON t.user_id = u.userid
         WHERE t.token_hash = ? AND t.expires_at > NOW()`,
        [tokenHash]
      )

      if (rows.length === 0) {
        return null
      }

      return rows[0]
    } catch (error) {
      console.error('Error verifying reset token:', error)
      throw new Error('Failed to verify reset token')
    }
  }

  static async deleteResetToken(tokenHash) {
    try {
      await dbConfig.execute(
        'DELETE FROM password_reset_tokens WHERE token_hash = ?',
        [tokenHash]
      )
      return true
    } catch (error) {
      console.error('Error deleting reset token:', error)
      return false
    }
  }
}