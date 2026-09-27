// src/app/api/(modules)/likes/like.service.ts
import pool, { withTransaction } from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

async function getStoryTableName(): Promise<string> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('stories', 'TASKS') ORDER BY (table_name = 'stories') DESC LIMIT 1"
    );
    return rows && rows.length > 0 ? rows[0].table_name : 'stories';
  } catch {
    return 'stories';
  }
}

export class LikeService {
  /**
   * Like an entity with atomic ACID transaction and materialized counter increment
   */
  static async likeItem(userId: number | string, entityId: number, entityType: string = 'story') {
    return withTransaction(async (conn) => {
      // 1. Insert into likes table (idempotent ignore)
      const [insertRes] = await conn.execute<ResultSetHeader>(
        'INSERT IGNORE INTO likes (user_id, entity_id, entity_type, created_at) VALUES (?, ?, ?, NOW())',
        [userId, entityId, entityType]
      );

      const table = await getStoryTableName();

      // 2. Increment materialized counter only if new like was recorded
      if (insertRes.affectedRows > 0 && (entityType === 'story' || entityType === 'task')) {
        try {
          await conn.execute(
            `UPDATE ${table} SET likes_count = likes_count + 1 WHERE id = ?`,
            [entityId]
          );
        } catch (err) {
          console.warn('Could not increment likes_count (column may not exist yet):', err);
        }
      }

      return { liked: true, message: 'Story liked successfully' };
    });
  }

  /**
   * Unlike an entity with atomic ACID transaction and materialized counter decrement
   */
  static async unlikeItem(userId: number | string, entityId: number, entityType: string = 'story') {
    return withTransaction(async (conn) => {
      // 1. Delete from likes table
      const [delRes] = await conn.execute<ResultSetHeader>(
        'DELETE FROM likes WHERE user_id = ? AND entity_id = ? AND entity_type = ?',
        [userId, entityId, entityType]
      );

      const table = await getStoryTableName();

      // 2. Decrement materialized counter only if row was deleted
      if (delRes.affectedRows > 0 && (entityType === 'story' || entityType === 'task')) {
        try {
          await conn.execute(
            `UPDATE ${table} SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?`,
            [entityId]
          );
        } catch (err) {
          console.warn('Could not decrement likes_count:', err);
        }
      }

      return { liked: false, message: 'Story unliked successfully' };
    });
  }

  /**
   * Check if user has liked a specific entity
   */
  static async hasUserLiked(userId: number | string, entityId: number, entityType: string = 'story'): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT 1 FROM likes WHERE user_id = ? AND entity_id = ? AND entity_type = ? LIMIT 1',
      [userId, entityId, entityType]
    );
    return Boolean(rows && rows.length > 0);
  }

  /**
   * Fetch all stories liked by the user
   */
  static async getUserLikedStories(userId: number | string) {
    const table = await getStoryTableName();

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT s.id, s.title, s.description, s.created_at, s.status, COALESCE(s.likes_count, 0) as likes_count, l.created_at as liked_at
       FROM ${table} s
       INNER JOIN likes l ON s.id = l.entity_id AND l.entity_type IN ('story', 'task')
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC`,
      [userId]
    );

    return rows || [];
  }
}
