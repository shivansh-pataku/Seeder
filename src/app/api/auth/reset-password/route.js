import crypto from 'crypto';
import { UserService } from '../../../lib/user.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Reset token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'New password is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash the incoming raw token with SHA-256 to compare against database
    const tokenHash = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');

    // Verify token exists and is not expired
    const tokenRecord = await UserService.verifyResetToken(tokenHash);
    if (!tokenRecord) {
      return new Response(
        JSON.stringify({
          error: 'This password reset link is invalid or has expired. Please request a new one.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the user's password
    await UserService.updatePasswordById(tokenRecord.user_id, password);

    // Invalidate / delete the used token immediately
    await UserService.deleteResetToken(tokenHash);

    return new Response(
      JSON.stringify({
        message: 'Password reset successfully. You can now sign in with your new password.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reset password API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
