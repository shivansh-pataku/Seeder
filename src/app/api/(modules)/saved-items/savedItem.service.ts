// src/app/api/(modules)/saved-items/savedItem.service.ts
import pool from '@/app/lib/db';
import { SaveItemInput } from './savedItem.schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

async function getStoryTableName(): Promise<string> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('stories', 'TASKS') ORDER BY (table_name = 'stories') DESC LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const row = rows[0] as RowDataPacket & { TABLE_NAME?: string; table_name?: string };
      return row.TABLE_NAME || row.table_name || 'stories';
    }
    return 'stories';
  } catch {
    return 'stories';
  }
}

export class SavedItemService {
  /**
   * Save an item / bookmark to a folder or root
   */
  static async saveItem(userId: number | string, input: SaveItemInput) {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO saved_items (user_id, folder_id, entity_id, entity_type, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, input.folderId || null, input.entityId, input.entityType]
      );

      return {
        id: result.insertId,
        saved: true,
        message: 'Story saved to bookmarks',
      };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY') {
        return {
          saved: true,
          message: 'Story is already in your saved bookmarks',
        };
      }
      throw err;
    }
  }

  /**
   * Remove a saved item / bookmark
   */
  static async unsaveItem(
    userId: number | string,
    entityId: number,
    entityType: string = 'story',
    folderId?: number | null
  ) {
    let query = 'DELETE FROM saved_items WHERE user_id = ? AND entity_id = ? AND entity_type = ?';
    const params: (string | number)[] = [userId, entityId, entityType];

    if (folderId !== undefined) {
      if (folderId === null) {
        query += ' AND folder_id IS NULL';
      } else {
        query += ' AND folder_id = ?';
        params.push(folderId);
      }
    }

    const [result] = await pool.execute<ResultSetHeader>(query, params);
    return {
      unsaved: result.affectedRows > 0,
      message: 'Story removed from bookmarks',
    };
  }

  /**
   * Check if a specific story is saved by the current user
   */
  static async isStorySaved(userId: number | string, storyId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT 1 FROM saved_items WHERE user_id = ? AND entity_id = ? AND entity_type IN ('story', 'task') LIMIT 1",
      [userId, storyId]
    );
    return Boolean(rows && rows.length > 0);
  }

  /**
   * Get all saved stories for user, optionally filtered by folder
   */
  static async getUserSavedStories(userId: number | string, folderId?: number | null) {
    const table = await getStoryTableName();

    let query = `
      SELECT 
        s.id, 
        s.title, 
        s.description, 
        s.created_at, 
        s.status,
        si.id as saved_item_id,
        si.folder_id,
        si.created_at as saved_at,
        f.name as folder_name,
        u.username,
        u.name,
        u.gender
      FROM saved_items si
      INNER JOIN ${table} s ON si.entity_id = s.id AND si.entity_type IN ('story', 'task')
      LEFT JOIN folders f ON si.folder_id = f.id
      LEFT JOIN users u ON s.userid = u.userid
      WHERE si.user_id = ?
    `;

    const params: (string | number)[] = [userId];

    if (folderId !== undefined) {
      if (folderId === null) {
        query += ' AND si.folder_id IS NULL';
      } else {
        query += ' AND si.folder_id = ?';
        params.push(folderId);
      }
    }

    query += ' ORDER BY si.created_at DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows || [];
  }
}
