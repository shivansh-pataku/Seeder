// src/app/api/articles/route.js
// Backward-compatible delegating route for published articles
import { StoryController } from '../(modules)/stories/story.controller';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const response = await StoryController.list(request);
  const data = await response.json();

  if (!data.success) {
    return NextResponse.json({ message: data.error?.message || 'Error' }, { status: response.status });
  }

  // Preserve legacy response shape: { articles: [...] }
  const stories = data.data.stories || [];
  const articles = stories.map((s) => ({
    id: s.id,
    title: s.title,
    snippet: s.snippet,
    description: s.description,
    story_type: s.story_type,
    createdAt: s.created_at,
    wordCount: s.word_count,
    readTimeMinutes: s.reading_time_minutes,
    likesCount: s.likes_count,
    author: s.author,
  }));

  return NextResponse.json({ articles }, { status: 200 });
}
