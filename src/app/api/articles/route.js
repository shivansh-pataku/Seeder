import dbConfig from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('GET /api/articles - Fetching published articles...');

    const [rows] = await dbConfig.execute(`
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.created_at, 
        t.status, 
        t.userid,
        u.username, 
        u.name,
        u.bio,
        u.gender,
        u.is_private
      FROM TASKS t
      LEFT JOIN users u ON t.userid = u.userid
      WHERE t.status = 1
      ORDER BY t.created_at DESC
    `);

    const articles = (rows || []).map((row) => {
      // Create clean plain text snippet from description HTML
      const rawHtml = row.description || '';
      const plainText = rawHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
      const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
      const isPrivate = row.is_private === 1;

      return {
        id: row.id,
        title: row.title?.trim() || 'Untitled Article',
        snippet: plainText.slice(0, 240) + (plainText.length > 240 ? '...' : ''),
        createdAt: row.created_at,
        wordCount: words,
        readTimeMinutes,
        author: {
          userid: isPrivate ? null : row.userid,
          username: isPrivate ? 'unknown' : (row.username || 'unknown'),
          name: isPrivate ? 'Unknown' : (row.name || row.username || 'Author'),
          bio: isPrivate ? '' : (row.bio || ''),
          gender: isPrivate ? '' : (row.gender || ''),
          isPrivate,
        },
      };
    });

    console.log(`Fetched ${articles.length} published articles`);

    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch articles', error: error.message },
      { status: 500 }
    );
  }
}
