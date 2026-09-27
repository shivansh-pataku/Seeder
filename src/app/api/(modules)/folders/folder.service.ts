// src/app/api/(modules)/folders/folder.service.ts
import pool from '@/app/lib/db';
import { CreateFolderInput } from './folder.schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class FolderService {
  /**
   * Create a folder (root or nested via parentId)
   */
  static async createFolder(userId: number | string, input: CreateFolderInput) {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO folders (user_id, name, parent_id, created_at) VALUES (?, ?, ?, NOW())',
      [userId, input.name.trim(), input.parentId || null]
    );

    return {
      id: result.insertId,
      name: input.name.trim(),
      parentId: input.parentId || null,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * List all folders for user (returns flat list with parent_id for building tree)
   */
  static async getUserFolders(userId: number | string) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, parent_id, created_at FROM folders WHERE user_id = ? ORDER BY name ASC',
      [userId]
    );

    return rows || [];
  }

  /**
   * Delete folder (cascades nested folders and sets saved items folder_id to NULL)
   */
  static async deleteFolder(userId: number | string, folderId: number | string) {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM folders WHERE id = ? AND user_id = ?',
      [folderId, userId]
    );

    return result.affectedRows > 0;
  }
}
