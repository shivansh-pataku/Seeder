// src/app/lib/getCurrentUser.ts
import { auth } from './auth.js';

export interface CurrentAuthUser {
  id: string;
  email?: string | null;
  username: string;
}

interface CustomSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  username?: string;
  gender?: string | null;
}

export async function getCurrentUser(): Promise<CurrentAuthUser | null> {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return null;
    }

    const customUser = session.user as CustomSessionUser;

    return {
      id: session.user.id,
      email: session.user.email,
      username: customUser.username || customUser.name || 'User',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export default getCurrentUser;
