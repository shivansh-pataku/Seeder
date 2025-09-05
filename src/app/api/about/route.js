// src/app/api/feedback/route.js - CREATE THIS FILE
import dbConfig from '../../lib/db.js'
import { getCurrentUser } from '../../lib/getCurrentUser.js'

export async function POST(request) {
  try {
    console.log('POST /api/about - Processing feedback submission...')
    
    // Get current authenticated user
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.log('No authenticated user found')
      return new Response(JSON.stringify({ 
        message: 'Authentication required',
        error: 'Not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { feedback_text } = body

    console.log('Feedback from user:', currentUser.email)
    console.log('Feedback text length:', feedback_text?.length)

    // Validate required fields
    if (!feedback_text || feedback_text.trim().length === 0) {
      return new Response(JSON.stringify({ 
        message: 'Feedback text is required',
        error: 'Missing feedback text' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (feedback_text.length > 1000) {
      return new Response(JSON.stringify({ 
        message: 'Feedback text is too long (max 1000 characters)',
        error: 'Text too long' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('💾 Saving feedback to database...')

    // Insert feedback into database
    const [result] = await dbConfig.execute(
      'INSERT INTO feedback (user_id, username, feedback_text, created_at) VALUES (?, ?, ?, NOW())',
      [
        currentUser.id, 
        currentUser.username || currentUser.name || currentUser.email, 
        feedback_text.trim()
      ]
    )

    console.log('✅ Feedback saved successfully with ID:', result.insertId)

    return new Response(JSON.stringify({ 
      message: 'Feedback saved successfully',
      feedback_id: result.insertId,
      success: true
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in feedback API:', error)
    
    // Handle database connection errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return new Response(JSON.stringify({ 
        message: 'Database table not found',
        error: 'Please create the feedback table' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Optional: GET endpoint to fetch feedback (for admin use)
export async function GET(request) {
  try {
    console.log('GET /api/feedback - Fetching feedback...')
    
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return new Response(JSON.stringify({ 
        message: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch recent feedback (limit to 20 entries)
    const [rows] = await dbConfig.execute(
      'SELECT id, username, feedback_text, created_at FROM feedback ORDER BY created_at DESC LIMIT 20'
    )

    console.log('📊 Found feedback entries:', rows.length)

    return new Response(JSON.stringify({ 
      feedback: rows,
      count: rows.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error fetching feedback:', error)
    return new Response(JSON.stringify({ 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}