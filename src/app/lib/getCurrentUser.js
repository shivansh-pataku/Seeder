// src/app/lib/getCurrentUser.js
import { auth } from '../api/auth/[...nextauth]/route.js'

export async function getCurrentUser() {
  try {
    console.log('Getting current user with NextAuth v5 Beta...')
    
    // Get session using NextAuth v5 Beta auth() function
    const session = await auth()
    
    if (!session || !session.user) {
      console.log('No authenticated session found')
      return null
    }
    
    console.log('Authenticated user found:', session.user.email)
    return {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username || session.user.name
    }
    
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}