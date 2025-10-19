// src/app/lib/auth.js
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import dbConfig from './db.js'

export const authOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Auth.js authorize called for:', credentials?.email)

        // credentials?.email → Safely accesses email (won’t throw an error if credentials is null or undefined).
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          // Check database for real users
          console.log('Checking database for user:', credentials.email)
          const [users] = await dbConfig.execute(
            'SELECT id, username, email, password FROM users WHERE email = ?',
            [credentials.email]
          )

          if (!users || users.length === 0) {
            console.log('User not found in database')
            return null
          }

          const user = users[0]
          console.log('Found user:', user.email)

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          console.log('Database user authenticated successfully')
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.username,
            username: user.username
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId
        session.user.username = token.username
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin', // will use this custom sign-in page when not signed in or session has expired or invalid or user not authorized.
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug in development which means that when an error occurs, more details will be logged to the console. other options are 'production' and 'test' in which debug is false means no debug logs.
}