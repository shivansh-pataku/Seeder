import crypto from 'crypto';
import dbConfig from '../../../../lib/db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and 6-digit verification code are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Query pending signup record
    const [rows] = await dbConfig.execute(
      'SELECT id, otp_hash, attempts, expires_at FROM pending_signups WHERE email = ?',
      [cleanEmail]
    );

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No pending registration found for this email. Please request a new code.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const record = rows[0];

    // Check attempts
    if (record.attempts >= 5) {
      return new Response(
        JSON.stringify({
          error: 'Too many incorrect attempts. Please request a new verification code.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: 'This verification code has expired. Please request a new one.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check OTP hash
    const inputHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');

    if (inputHash !== record.otp_hash) {
      const nextAttempts = record.attempts + 1;
      await dbConfig.execute(
        'UPDATE pending_signups SET attempts = ? WHERE email = ?',
        [nextAttempts, cleanEmail]
      );

      const remaining = Math.max(0, 5 - nextAttempts);
      return new Response(
        JSON.stringify({
          error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // OTP matched! Generate a single-use verification token to authorize profile creation
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await dbConfig.execute(
      'UPDATE pending_signups SET verification_token = ?, attempts = 0 WHERE email = ?',
      [verificationToken, cleanEmail]
    );

    return new Response(
      JSON.stringify({
        success: true,
        verificationToken,
        message: 'Email verified successfully! Please choose your username and password.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to verify code. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
