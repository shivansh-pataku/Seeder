// src/app/api/(modules)/stories/story.service.ts
import pool from '@/app/lib/db';
import { CreateStoryInput, UpdateStoryInput, StoryDTO } from './story.schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Cache the active table name ('stories' or fallback 'TASKS')
let resolvedTableName: string | null = null;

async function getStoryTableName(): Promise<string> {
  if (resolvedTableName) return resolvedTableName;

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('stories', 'TASKS') ORDER BY (table_name = 'stories') DESC LIMIT 1"
    );

    if (rows && rows.length > 0) {
      resolvedTableName = rows[0].table_name || 'stories';
    } else {
      resolvedTableName = 'stories';
    }
  } catch {
    resolvedTableName = 'stories';
  }

  return resolvedTableName || 'stories';
}

export function extractSnippet(html: string, maxLen: number = 240): string {
  if (!html) return '';
  const plain = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).trim() + '...';
}

export function calculateWordCount(text: string): number {
  if (!text) return 0;
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
}

export function calculateReadingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

export class StoryService {
  /**
   * Create a new story (draft or published)
   */
  static async createStory(userId: number | string, input: CreateStoryInput): Promise<StoryDTO> {
    const table = await getStoryTableName();
    const cleanTitle = input.title || 'Untitled Story';
    const description = input.description || '';
    const snippet = extractSnippet(description);
    const words = calculateWordCount(description);
    const readTime = calculateReadingTime(words);
    const status = input.status ? 1 : 0;
    const storyType = input.story_type || 'article';

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${table} 
         (title, description, snippet, story_type, word_count, reading_time_minutes, userid, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [cleanTitle, description, snippet, storyType, words, readTime, userId, status]
      );

      return {
        id: result.insertId,
        title: cleanTitle,
        snippet,
        description,
        story_type: storyType,
        status: status === 1,
        word_count: words,
        reading_time_minutes: readTime,
        likes_count: 0,
        created_at: new Date().toISOString(),
      };
    } catch {
      // Fallback if schema doesn't yet have newly added columns
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${table} (title, description, userid, status, created_at) VALUES (?, ?, ?, ?, NOW())`,
        [cleanTitle, description, userId, status]
      );

      return {
        id: result.insertId,
        title: cleanTitle,
        snippet,
        description,
        story_type: storyType,
        status: status === 1,
        word_count: words,
        reading_time_minutes: readTime,
        likes_count: 0,
        created_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch all published stories for the public reader feed
   */
  static async getPublishedStories(): Promise<StoryDTO[]> {
    const table = await getStoryTableName();

    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        s.id, 
        s.title, 
        s.description, 
        s.created_at, 
        s.status, 
        s.userid,
        COALESCE(s.likes_count, 0) as likes_count,
        u.username, 
        u.name,
        u.bio,
        u.gender,
        u.is_private
      FROM ${table} s
      LEFT JOIN users u ON s.userid = u.userid
      WHERE s.status = 1
      ORDER BY s.created_at DESC
    `);

    return (rows || []).map((row) => {
      const rawHtml = row.description || '';
      const snippet = row.snippet || extractSnippet(rawHtml);
      const words = row.word_count || calculateWordCount(rawHtml);
      const readTime = row.reading_time_minutes || calculateReadingTime(words);
      const isPrivate = row.is_private === 1;

      return {
        id: row.id,
        title: row.title?.trim() || 'Untitled Story',
        snippet,
        story_type: row.story_type || 'article',
        status: row.status === 1,
        word_count: words,
        reading_time_minutes: readTime,
        likes_count: Number(row.likes_count || 0),
        created_at: row.created_at,
        author: {
          id: isPrivate ? null : row.userid,
          username: isPrivate ? 'unknown' : (row.username || 'unknown'),
          name: isPrivate ? 'Unknown' : (row.name || row.username || 'Author'),
          bio: isPrivate ? '' : (row.bio || ''),
          gender: isPrivate ? '' : (row.gender || ''),
          isPrivate,
        },
      };
    });
  }

  /**
   * Fetch stories belonging to a specific user (for Writer Desk)
   */
  static async getUserStories(userId: number | string): Promise<StoryDTO[]> {
    const table = await getStoryTableName();

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, description, status, created_at, COALESCE(likes_count, 0) as likes_count
       FROM ${table} 
       WHERE userid = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    return (rows || []).map((row) => {
      const rawHtml = row.description || '';
      const snippet = row.snippet || extractSnippet(rawHtml);
      const words = row.word_count || calculateWordCount(rawHtml);
      const readTime = row.reading_time_minutes || calculateReadingTime(words);

      return {
        id: row.id,
        title: row.title?.trim() || 'Untitled Story',
        snippet,
        story_type: row.story_type || 'article',
        status: row.status === 1,
        word_count: words,
        reading_time_minutes: readTime,
        likes_count: Number(row.likes_count || 0),
        created_at: row.created_at,
      };
    });
  }

  /**
   * Fetch a single story by ID (for reading page or desk editor)
   */
  static async getStoryById(
    storyId: number | string,
    currentUserId?: number | string | null
  ): Promise<StoryDTO | null> {
    const table = await getStoryTableName();

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        s.id, 
        s.title, 
        s.description, 
        s.created_at, 
        s.status, 
        s.userid,
        COALESCE(s.likes_count, 0) as likes_count,
        u.username, 
        u.name,
        u.bio,
        u.location,
        u.gender,
        u.socialProfiles,
        u.is_private
      FROM ${table} s
      LEFT JOIN users u ON s.userid = u.userid
      WHERE s.id = ?`,
      [storyId]
    );

    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    const isOwner = Boolean(
      currentUserId && currentUserId.toString() === row.userid?.toString()
    );

    // Private draft check
    if (row.status !== 1 && !isOwner) {
      return null;
    }

    const rawHtml = row.description || '';
    const snippet = row.snippet || extractSnippet(rawHtml);
    const words = row.word_count || calculateWordCount(rawHtml);
    const readTime = row.reading_time_minutes || calculateReadingTime(words);
    const isPrivate = row.is_private === 1 && !isOwner;

    return {
      id: row.id,
      title: row.title?.trim() || 'Untitled Story',
      description: row.description || '',
      snippet,
      story_type: row.story_type || 'article',
      status: row.status === 1,
      word_count: words,
      reading_time_minutes: readTime,
      likes_count: Number(row.likes_count || 0),
      created_at: row.created_at,
      author: {
        id: isPrivate ? null : row.userid,
        username: isPrivate ? 'unknown' : (row.username || 'unknown'),
        name: isPrivate ? 'Unknown' : (row.name || row.username || 'Author'),
        bio: isPrivate ? '' : (row.bio || ''),
        location: isPrivate ? '' : (row.location || ''),
        gender: isPrivate ? '' : (row.gender || ''),
        isPrivate,
      },
    };
  }

  /**
   * Update a story owned by the user
   */
  static async updateStory(userId: number | string, input: UpdateStoryInput): Promise<boolean> {
    const table = await getStoryTableName();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title.trim() || 'Untitled Story');
    }

    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);

      const snippet = extractSnippet(input.description);
      const words = calculateWordCount(input.description);
      const readTime = calculateReadingTime(words);

      try {
        updates.push('snippet = ?', 'word_count = ?', 'reading_time_minutes = ?');
        values.push(snippet, words, readTime);
      } catch {
        // Continue if columns not yet altered
      }
    }

    if (input.story_type !== undefined) {
      try {
        updates.push('story_type = ?');
        values.push(input.story_type);
      } catch {
        // Continue
      }
    }

    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    if (updates.length === 0) return true;

    values.push(input.id, userId);
    const query = `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ? AND userid = ?`;

    const [result] = await pool.execute<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Delete a story owned by the user
   */
  static async deleteStory(userId: number | string, storyId: number | string): Promise<boolean> {
    const table = await getStoryTableName();
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM ${table} WHERE id = ? AND userid = ?`,
      [storyId, userId]
    );
    return result.affectedRows > 0;
  }
}
