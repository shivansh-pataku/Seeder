import dbConfig from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/getCurrentUser.js';

export async function DELETE() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required to delete account' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = currentUser.id;
    const email = currentUser.email;

    // 1. Delete associated feedback
    try {
      await dbConfig.execute('DELETE FROM feedback WHERE userid = ?', [userId]);
    } catch (e) {
      console.warn('Feedback delete notice:', e.message);
    }

    // 2. Delete associated stories/tasks
    try {
      await dbConfig.execute('DELETE FROM TASKS WHERE userid = ?', [userId]);
    } catch (e) {
      console.warn('Tasks delete notice:', e.message);
    }

    // 3. Delete password reset tokens
    try {
      await dbConfig.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    } catch (e) {
      console.warn('Tokens delete notice:', e.message);
    }

    // 4. Delete pending signups if any
    try {
      if (email) {
        await dbConfig.execute('DELETE FROM pending_signups WHERE email = ?', [email]);
      }
    } catch (e) {
      console.warn('Pending signups delete notice:', e.message);
    }

    // 5. Delete the user record itself
    const [result] = await dbConfig.execute('DELETE FROM users WHERE userid = ?', [userId]);

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({ error: 'User account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User account ${userId} (${email}) permanently deleted.`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account permanently deleted' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete account. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
