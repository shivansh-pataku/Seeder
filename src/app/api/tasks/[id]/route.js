// src/app/api/tasks/[id]/route.js
import dbConfig from '../../../lib/db.js'
import { getCurrentUser } from '../../../lib/getCurrentUser.js'

//////////////// GET single task by ID /////////////////////////////////////
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get current authenticated user
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return new Response(JSON.stringify({
        message: 'Authentication required',
        error: 'Not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch single task by primary key (very fast query)
    const [rows] = await dbConfig.execute(
      'SELECT * FROM TASKS WHERE id = ? AND userid = ?',
      [id, currentUser.id]
    )

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({
        message: 'Story not found',
        error: 'Not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      task: {
        ...rows[0],
        status: rows[0].status === 1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error fetching task by ID:', error)
    return new Response(JSON.stringify({
      message: 'Internal server error',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
