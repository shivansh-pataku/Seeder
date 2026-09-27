// src/app/api/articles/[id]/route.js
// Backward-compatible delegating route for single published article
import { StoryController } from '../../(modules)/stories/story.controller';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const response = await StoryController.getById(request, id);
  const data = await response.json();

  if (!data.success) {
    return NextResponse.json({ message: data.error?.message || 'Article not found' }, { status: response.status });
  }

  const s = data.data.story;
  const article = {
    id: s.id,
    title: s.title,
    content: s.description,
    snippet: s.snippet,
    story_type: s.story_type,
    createdAt: s.created_at,
    status: s.status ? 1 : 0,
    wordCount: s.word_count,
    readTimeMinutes: s.reading_time_minutes,
    likesCount: s.likes_count,
    isLiked: Boolean(s.is_liked),
    author: s.author,
  };

  return NextResponse.json({ article }, { status: 200 });
}
