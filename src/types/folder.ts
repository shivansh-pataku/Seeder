export interface FolderItem {
  id: number | string;
  name: string;
  user_id?: number | string;
  created_at?: string;
  items_count?: number;
}

export interface SavedItem {
  id: number | string;
  saved_item_id?: number | string;
  story_id: number | string;
  folder_id?: number | string | null;
  folder_name?: string | null;
  title: string;
  snippet?: string;
  preview?: string;
  author_name?: string;
  saved_at?: string;
  liked_at?: string;
  likes_count?: number;
}
