import dbConfig from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/getCurrentUser';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'Article ID is required' }, { status: 400 });
  }

  try {
    const [rows] = await dbConfig.execute(
      `
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
        u.location,
        u.gender,
        u.socialProfiles,
        u.is_private
      FROM TASKS t
      LEFT JOIN users u ON t.userid = u.userid
      WHERE t.id = ?
    `,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    const row = rows[0];

    const currentUser = await getCurrentUser();
    const isOwner = currentUser && (
      currentUser.id?.toString() === row.userid?.toString() ||
      currentUser.username === row.username
    );

    // If the article is a draft (status = 0), check if the current user is the owner
    if (row.status !== 1) {
      if (!isOwner) {
        return NextResponse.json({ message: 'Article not found or private' }, { status: 404 });
      }
    }

    const rawHtml = row.description || '';
    const plainText = rawHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

    let socialProfiles = null;
    try {
      if (row.socialProfiles) {
        socialProfiles =
          typeof row.socialProfiles === 'string'
            ? JSON.parse(row.socialProfiles)
            : row.socialProfiles;
      }
    } catch (e) {
      console.warn('Failed to parse socialProfiles:', e);
    }

    const isPrivate = row.is_private === 1 && !isOwner;

    const article = {
      id: row.id,
      title: row.title?.trim() || 'Untitled Story',
      content: row.description || '',
      createdAt: row.created_at,
      status: row.status,
      wordCount: words,
      readTimeMinutes,
      author: isPrivate
        ? {
            userid: null,
            username: 'unknown',
            name: 'Unknown',
            bio: '',
            location: '',
            gender: '',
            socialProfiles: [],
            isPrivate: true,
          }
        : {
            userid: row.userid,
            username: row.username || 'unknown',
            name: row.name || row.username || 'Author',
            bio: row.bio || '',
            location: row.location || '',
            gender: row.gender || '',
            socialProfiles,
            isPrivate: Boolean(row.is_private),
          },
    };

    return NextResponse.json({ article }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching article ${id}:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
