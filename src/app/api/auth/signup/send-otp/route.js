import crypto from 'crypto';
import dbConfig from '../../../../lib/db.js';
import { UserService } from '../../../../lib/user.js';
import { sendSignupOtpEmail } from '../../../../lib/mail.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Check if account already exists in users table
    const existingUser = await UserService.findByEmail(cleanEmail);
    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: 'An account with this email already exists. Please sign in.',
          alreadyRegistered: true,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Step 3: Upsert into pending_signups table
    await dbConfig.execute(
      `INSERT INTO pending_signups (email, otp_hash, attempts, verification_token, expires_at)
       VALUES (?, ?, 0, NULL, ?)
       ON DUPLICATE KEY UPDATE 
         otp_hash = VALUES(otp_hash),
         attempts = 0,
         verification_token = NULL,
         expires_at = VALUES(expires_at),
         created_at = CURRENT_TIMESTAMP`,
      [cleanEmail, otpHash, expiresAt]
    );

    // Step 4: Dispatch OTP email
    await sendSignupOtpEmail(cleanEmail, otp);

    return new Response(
      JSON.stringify({
        message: 'A 6-digit verification code has been sent to your email.',
        success: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-otp route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send verification code. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
