import dbConfig from '../../../../lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim();

    if (!username) {
      return new Response(
        JSON.stringify({ available: false, error: 'Username is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (username.length < 3) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'Username must be at least 3 characters',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (username.length > 30) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'Username cannot exceed 30 characters',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'Letters, numbers, dots, dashes, and underscores only',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check against MySQL users table
    const [rows] = await dbConfig.execute(
      'SELECT userid FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username]
    );

    if (rows.length > 0) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'Username is already taken',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        available: true,
        message: 'Username is available',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-username route:', error);
    return new Response(
      JSON.stringify({ available: false, error: 'Failed to verify username availability' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
