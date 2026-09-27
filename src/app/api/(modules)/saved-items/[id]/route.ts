// src/app/api/(modules)/saved-items/[id]/route.ts
import { handleSuccessResponse, handleErrorResponse } from '@/app/lib/errorHandler';
import { getCurrentUser } from '@/app/lib/getCurrentUser';
import pool from '@/app/lib/db';
import { ResultSetHeader } from 'mysql2';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return handleErrorResponse({ message: 'Authentication required', status: 401 });
    }

    const { id } = await params;
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM saved_items WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (result.affectedRows === 0) {
      return handleErrorResponse({ message: 'Saved item not found or unauthorized', status: 404 });
    }

    return handleSuccessResponse({ id }, 'Saved item removed successfully');
  } catch (error) {
    return handleErrorResponse(error);
  }
}
