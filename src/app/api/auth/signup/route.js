// src/app/api/auth/signup/route.js - CREATE THIS FILE
import { UserService } from '../../../lib/user.js'

export async function POST(request) {
  try {
    console.log('📝 POST /api/auth/signup - Creating new user...')
    
    const body = await request.json()
    const { username, email, password } = body

    console.log('👤 Signup attempt for:', email)

    // Validate required fields
    if (!username || !email || !password) {
      console.log('Missing required fields')
      return new Response(JSON.stringify({ 
        error: 'Username, email, and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Invalid email format')
      return new Response(JSON.stringify({ 
        error: 'Please enter a valid email address' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate password length
    if (password.length < 6) {
      console.log('Password too short')
      return new Response(JSON.stringify({ 
        error: 'Password must be at least 6 characters long' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email)
    if (existingUser) {
      console.log('User already exists')
      return new Response(JSON.stringify({ 
        error: 'User with this email already exists' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create new user
    const userId = await UserService.createUser({
      username,
      email,
      password
    })

    console.log('User created successfully with ID:', userId)

    return new Response(JSON.stringify({ 
      message: 'Account created successfully',
      userId: userId 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    // Handle specific database errors
    if (error.message.includes('Duplicate entry')) {
      return new Response(JSON.stringify({ 
        error: 'Email address is already registered' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}