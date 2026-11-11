export interface StoryAuthor {
  id?: number | null;
  username?: string;
  name?: string;
  gender?: string;
  bio?: string;
  avatar_url?: string;
  isPrivate?: boolean;
}

export interface Story {
  id: number | string;
  title: string;
  content?: string;
  description?: string;
  snippet?: string;
  preview?: string;
  status?: boolean | number;
  is_published?: boolean;
  story_type?: string;
  reading_time_minutes?: number;
  readTimeMinutes?: number;
  word_count?: number;
  wordCount?: number;
  likes_count?: number;
  likesCount?: number;
  is_liked?: boolean;
  isLiked?: boolean;
  author?: StoryAuthor;
  author_id?: number | string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface StoryFeedItem extends Story {}
export interface StoryDeskItem extends Story {}
export interface StoryProfileItem extends Story {}
export interface ReadArticle extends Story {}

export interface OutlineItem {
  level: number;
  text: string;
  pos?: number;
}

export interface EditorStats {
  words: number;
  characters: number;
  readTime: number;
}

export type SaveStatus = 'saved' | 'saving' | 'error';
