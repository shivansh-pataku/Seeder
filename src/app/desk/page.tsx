import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { StoryService } from '@/app/api/(modules)/stories/story.service';
import DeskPage from '@/components/Desk/DeskPage';
import type { StoryDeskItem } from '@/components/Stories';

export const metadata: Metadata = {
  title: 'Desk | Meridian',
  description: 'Manage and write your stories',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/desk');
  }

  let initialStories: StoryDeskItem[] = [];
  try {
    const rawStories = await StoryService.getUserStories(session.user.id);
    initialStories = (rawStories || []).map((story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      snippet: story.snippet,
      status: story.status,
      reading_time_minutes: story.reading_time_minutes,
      word_count: story.word_count,
      created_at: story.created_at,
    }));
  } catch (error) {
    console.error('Failed to load initial desk stories on server:', error);
  }

  return <DeskPage initialStories={initialStories} />;
}
