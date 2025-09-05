// src/app/api/me/route.js
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth.js'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ user: null })
    }

    return Response.json({ 
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        username: session.user.username
      }
    })
  } catch (error) {
    console.error('Error in /api/me:', error)
    return Response.json({ user: null }, { status: 500 })
  }
}