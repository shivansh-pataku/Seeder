// src/app/api/tasks/route.js
import dbConfig from '../../lib/db.js'
import { getCurrentUser } from '../../lib/getCurrentUser.js'

//////////////// RESTful GET handler /////////////////////////////////////
// export async function GET(request) {
export async function GET() {
  try {
    console.log('GET /api/tasks - Fetching tasks...')
    
    // Get current authenticated user
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.log('No authenticated user - returning 401')
      return new Response(JSON.stringify({ 
        message: 'Authentication required',
        error: 'Not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('Fetching tasks for user:', currentUser.email)

    // Lightweight list: no full description, just a short preview for cards
    const [rows] = await dbConfig.execute(
      'SELECT id, title, status, created_at, SUBSTRING(description, 1, 300) AS preview FROM TASKS WHERE userid = ? ORDER BY created_at DESC', 
      [currentUser.id]
    )

    console.log('Found tasks:', rows.length)

    // If no tasks are found, return an empty array
    const tasks = rows && rows.length > 0 ? rows.map(task => ({
      ...task,
      status: task.status === 1 // Convert 1/0 to boolean for frontend
    })) : []

    return new Response(JSON.stringify({ tasks }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return new Response(JSON.stringify({ 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

//////////////// RESTful POST handler /////////////////////////////////////
export async function POST(request) {
  try {
    console.log('POST /api/tasks - Creating task...')
    
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

    const body = await request.json()
    const { title, description } = body

    const cleanTitle = (title || '').trim()
    const cleanDescription = (description || '').trim()

    // Validate that at least title or description is provided
    if (!cleanTitle && !cleanDescription) {
      return new Response(JSON.stringify({ 
        message: 'A title or text content is required',
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const finalTitle = cleanTitle || 'Untitled Story'
    const finalDescription = description || ''

    console.log('Creating writing for user:', currentUser.email)

    // Fix: Use .execute() instead of .query()
    const [result] = await dbConfig.execute(
      'INSERT INTO TASKS (title, description, userid, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [finalTitle, finalDescription, currentUser.id, body.status ? 1 : 0]
    )

    // Fetch the newly created task
    const [newTask] = await dbConfig.execute(
      'SELECT * FROM TASKS WHERE id = ?',
      [result.insertId]
    )

    console.log('Writing created with ID:', result.insertId)

    return new Response(JSON.stringify({ 
      message: 'Writing created successfully',
      task: {
        ...newTask[0],
        status: newTask[0].status === 1
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error creating task:', error)
    return new Response(JSON.stringify({ 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ... (other methods with same .execute() fixes)

//////////////// RESTful PUT handler /////////////////////////////////////
export async function PUT(request) {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new Response(JSON.stringify({ 
        message: 'Authentication required',
        error: 'Not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, title, description, status } = body;

    // Validate required fields
    if (!id) {
      return new Response(JSON.stringify({ 
        message: 'ID is required',
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanTitle = (title || '').trim();
    const finalTitle = cleanTitle || 'Untitled Story';
    const finalDescription = description !== undefined ? description : '';

    let updateQuery = 'UPDATE TASKS SET title = ?, description = ?';
    const queryParams = [finalTitle, finalDescription];

    if (status !== undefined) {
      updateQuery += ', status = ?';
      queryParams.push(status ? 1 : 0);
    }

    updateQuery += ' WHERE id = ? AND userid = ?';
    queryParams.push(id, currentUser.id);

    // Update task (ensure it belongs to current user)
    const [result] = await dbConfig.execute(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ 
        message: 'Task not found or unauthorized',
        error: 'Update failed' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the updated task
    const [updatedTask] = await dbConfig.execute(
      'SELECT * FROM TASKS WHERE id = ? AND userid = ?',
      [id, currentUser.id]
    );

    return new Response(JSON.stringify({ 
      message: 'Task updated successfully',
      task: {
        ...updatedTask[0],
        status: updatedTask[0].status === 1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return new Response(JSON.stringify({ 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

//////////////// RESTful DELETE handler /////////////////////////////////////
export async function DELETE(request) {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new Response(JSON.stringify({ 
        message: 'Authentication required',
        error: 'Not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id } = body;

    // Validate required fields
    if (!id) {
      return new Response(JSON.stringify({ 
        message: 'Task ID is required',
        error: 'ID missing' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete task (ensure it belongs to current user)
    const [result] = await dbConfig.execute(
      'DELETE FROM TASKS WHERE id = ? AND userid = ?',
      [id, currentUser.id]
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ 
        message: 'Task not found or unauthorized',
        error: 'Delete failed' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Task deleted successfully',
      deletedId: id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({ 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

//////////////// RESTful PATCH handler for updating task status /////////////////////////////////////
export async function PATCH(request) {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return new Response(JSON.stringify({ 
        message: 'Authentication required',
        error: 'Not authenticated' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, status } = body;

    // Validate required fields
    if (!id) {
      return new Response(JSON.stringify({ 
        message: 'Task ID is required',
        error: 'ID missing' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (status === undefined || status === null) {
      return new Response(JSON.stringify({ 
        message: 'Status is required',
        error: 'Status missing' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update only the status (ensure it belongs to current user)
    const [result] = await dbConfig.execute(
      'UPDATE TASKS SET status = ? WHERE id = ? AND userid = ?',
      [status ? 1 : 0, id, currentUser.id]
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ 
        message: 'Task not found or unauthorized',
        error: 'Status update failed' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the updated task
    const [updatedTask] = await dbConfig.execute(
      'SELECT * FROM TASKS WHERE id = ? AND userid = ?',
      [id, currentUser.id]
    );

    return new Response(JSON.stringify({ 
      message: 'Status updated successfully',
      task: {
        ...updatedTask[0],
        status: updatedTask[0].status === 1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    return new Response(JSON.stringify({ 
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}