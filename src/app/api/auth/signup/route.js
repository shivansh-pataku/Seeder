import dbConfig from '../../../lib/db.js';
import { UserService } from '../../../lib/user.js';
import { sendWelcomeEmail } from '../../../lib/mail.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { verificationToken, username, password } = body;

    // Validate required parameters
    if (!verificationToken) {
      return new Response(
        JSON.stringify({ error: 'Missing email verification token. Please verify your email first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Validate verification token from pending_signups
    const [pendingRows] = await dbConfig.execute(
      'SELECT id, email, expires_at FROM pending_signups WHERE verification_token = ?',
      [verificationToken]
    );

    if (pendingRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification session. Please request a new code.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pendingRecord = pendingRows[0];

    if (new Date(pendingRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Verification session has expired. Please request a new code.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const email = pendingRecord.email;

    // Step 2: Validate username format and availability
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return new Response(
        JSON.stringify({ error: 'Username must be between 3 and 30 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'Username can only contain letters, numbers, underscores, dots, and dashes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [existingUsers] = await dbConfig.execute(
      'SELECT userid FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [cleanUsername]
    );
    if (existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Username is already taken. Please choose another one.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Strong password validation
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return new Response(
        JSON.stringify({
          error: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Create user in MySQL
    const userId = await UserService.createUser({
      username: cleanUsername,
      email,
      password,
    });

    // Step 5: Clean up pending signup row
    await dbConfig.execute(
      'DELETE FROM pending_signups WHERE email = ?',
      [email]
    );

    // Step 6: Dispatch welcome email (non-blocking)
    try {
      await sendWelcomeEmail(email, cleanUsername);
    } catch (mailErr) {
      console.error('Failed to send welcome email:', mailErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully! You can now sign in.',
        userId,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Complete signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}