import nodemailer from 'nodemailer';

/**
 * Base Transporter & Sender
 * Centralized internal function that handles SMTP connection,
 * error handling, and the development console preview fallback.
 */
async function sendMail({ to, subject, html, text, replyTo, from }) {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const port = process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT;
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const defaultFrom = process.env.EMAIL_FROM || '"Project Support" <no-reply@example.com>';

  const isSmtpConfigured = !!(host && user && pass);

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(port) || 587,
        secure: Number(port) === 465,
        auth: { user, pass },
      });

      const mailOptions = {
        from: from || defaultFrom,
        to,
        subject,
        text,
        html,
        ...(replyTo ? { replyTo } : {}),
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(`Email sent successfully to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (smtpError) {
      console.error('SMTP sending error:', smtpError.message);
      // Fall through to log in terminal so development is not blocked
    }
  }

  // Fallback for development: output clearly in the console
  console.log('\n' + '='.repeat(70));
  console.log('[EMAIL SIMULATION - DEVELOPMENT]');
  console.log(`To: ${to}`);
  if (replyTo) console.log(`Reply-To: ${replyTo}`);
  console.log(`Subject: ${subject}`);
  console.log('Content:');
  console.log(text.trim());
  console.log('='.repeat(70) + '\n');

  return { success: true, simulated: true };
}

/**
 * Standard Email Wrapper Template
 * Gives all system emails consistent layout, fonts, and branding.
 */
function emailLayout({ title, contentHtml }) {
  return `
    <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #111827; margin-top: 0;">${title}</h2>
      ${contentHtml}
      <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        This email was sent automatically from Project. If you have questions, please contact support.
      </p>
    </div>
  `;
}

/**
 * 1. Password Reset Email
 */
export async function sendPasswordResetEmail(email, resetUrl) {
  const contentHtml = `
    <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to choose a new password:
    </p>
    <div style="margin: 28px 0; text-align: center;">
      <a href="${resetUrl}" 
         style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">
        Reset Password
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
      This link will expire in <strong>30 minutes</strong> and can only be used once.
    </p>
    <div style="color: #9ca3af; font-size: 11px; word-break: break-all; margin-top: 12px;">
      Direct link: <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
    </div>
  `;

  return sendMail({
    to: email,
    subject: 'Password Reset Instructions',
    html: emailLayout({ title: 'Reset Your Password', contentHtml }),
    text: `Reset your password by visiting the following link:\n\n${resetUrl}\n\nThis link will expire in 30 minutes. If you did not request this, please ignore this email.`,
  });
}

/**
 * 2. Welcome Email on Signup
 */
export async function sendWelcomeEmail(email, username) {
  const appUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  const loginUrl = `${appUrl.replace(/\/$/, '')}/auth/signin`;

  const contentHtml = `
    <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
      Hi <strong>${username || 'there'}</strong>,
    </p>
    <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
      Welcome to our platform! Your account has been created successfully. You can now log in to your desk and start exploring.
    </p>
    <div style="margin: 28px 0; text-align: center;">
      <a href="${loginUrl}" 
         style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">
        Go to Sign In
      </a>
    </div>
    <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
      If you have any questions or need help getting started, simply reply to this email.
    </p>
  `;

  return sendMail({
    to: email,
    subject: `Welcome to the platform, ${username || 'User'}!`,
    html: emailLayout({ title: 'Welcome aboard!', contentHtml }),
    text: `Hi ${username || 'there'},\n\nWelcome to our platform! Your account has been created successfully.\n\nYou can log in here: ${loginUrl}\n\nHappy writing!`,
  });
}

/**
 * 3. Signup Verification OTP Email
 */
export async function sendSignupOtpEmail(email, otp) {
  const contentHtml = `
    <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
      Thank you for starting your registration. To complete your signup and verify your email address, please use the verification code below:
    </p>

    <div style="background-color: #f3f4f6; border-left: 4px solid #111827; padding: 18px 24px; margin: 24px 0; text-align: center; border-radius: 4px;">
      <span style="font-family: Consolas, 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">${otp}</span>
    </div>

    <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
      This code will expire in <strong>10 minutes</strong>. If you did not initiate this request, please disregard this email.
    </p>
  `;

  return sendMail({
    to: email,
    subject: `Your Verification Code: ${otp}`,
    html: emailLayout({ title: 'Email Verification', contentHtml }),
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this, please ignore this email.`,
  });
}

/**
 * 4. User Feedback Email (Sent to admin from logged-in user)
 */
export async function sendFeedbackEmail({ user, feedbackText, feedbackId }) {
  const adminEmail = process.env.FEEDBACK_RECIPIENT_EMAIL || process.env.SMTP_USER;
  const senderName = user.name || user.username || 'User';

  const contentHtml = `
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #374151;"><strong>From:</strong> ${senderName} (${user.email})</p>
      <p style="margin: 0 0 6px 0; font-size: 14px; color: #374151;"><strong>User ID:</strong> ${user.id}</p>
      <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Feedback ID:</strong> #${feedbackId || 'N/A'}</p>
    </div>

    <div style="background-color: #ffffff; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; font-size: 15px; color: #1f2937; white-space: pre-wrap; line-height: 1.6;">${feedbackText}</p>
    </div>

    <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
      You can reply directly to this email to get in touch with <strong>${senderName}</strong>.
    </p>
  `;

  const text = `New Feedback Received:\n\nUser: ${senderName} (${user.email}, ID: ${user.id})\nFeedback ID: #${feedbackId || 'N/A'}\n\nMessage:\n${feedbackText}\n\nYou can reply directly to this email to contact the user.`;

  return sendMail({
    to: adminEmail,
    replyTo: user.email,
    from: `"${senderName} (Feedback)" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
    subject: `New Feedback from ${senderName} (${user.email})`,
    html: emailLayout({ title: 'New User Feedback Received', contentHtml }),
    text,
  });
}

// Export alias for backwards compatibility
export { sendFeedbackEmail as sendFeedbackNotificationEmail };
