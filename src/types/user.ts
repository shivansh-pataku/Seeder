export interface SessionUser {
  id: string | number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  gender?: string | null;
}

export interface UserProfile {
  id: number | string;
  name: string;
  username: string;
  email?: string;
  bio?: string;
  gender?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  x?: string;
  instagram?: string;
  reddit?: string;
  behance?: string;
  pinterest?: string;
  created_at?: string;
  stories_count?: number;
  likes_count?: number;
}
