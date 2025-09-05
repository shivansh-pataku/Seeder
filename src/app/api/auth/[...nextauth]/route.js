// src/app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { UserService } from '../../../lib/user.js'

console.log('NextAuth v5 Beta with Database loading...')
console.log('Environment check:')
console.log('  - AUTH_SECRET exists:', !!process.env.AUTH_SECRET)
console.log('  - AUTH_URL:', process.env.AUTH_URL)
console.log('  - DB_HOST:', process.env.DB_HOST)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('v5 Beta authorize called for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          // Step 1: Keep test user for fallback
          if (credentials.email === 'test@test.com' && credentials.password === 'password') {
            console.log('Test user authenticated (hardcoded)')
            return {
              id: '999',
              email: 'test@test.com',
              name: 'Test User',
              username: 'testuser'
            }
          }

          // Step 2: Check database for real users
          console.log('Checking database for user...')
          const user = await UserService.findByEmail(credentials.email)
          
          if (!user) {
            console.log('User not found in database')
            return null
          }

          // Step 3: Verify password
          const isPasswordValid = await UserService.verifyPassword(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          // Step 4: Return user data (v5 Beta format)
          console.log('Database user authenticated successfully')
          return {
            id: user.userid.toString(),
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
    // v5 Beta - Enhanced callbacks
    async jwt({ token, user, account }) {
      console.log('JWT callback - v5 Beta')
      if (user) {
        token.userId = user.id
        token.username = user.username
        token.provider = account?.provider || 'credentials'
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - v5 Beta')
      if (token) {
        session.user.id = token.userId
        session.user.username = token.username
        session.user.provider = token.provider
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  // v5 Beta - Enhanced debugging
  debug: process.env.NODE_ENV === 'development',
})

export const GET = handlers.GET
export const POST = handlers.POST