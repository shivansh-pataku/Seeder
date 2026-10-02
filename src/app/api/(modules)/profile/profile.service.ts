// src/app/api/(modules)/profile/profile.service.ts
import pool from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { UpdateProfileInput } from './profile.schema';

export interface ProfileUserDTO {
  userid?: number | null;
  username: string;
  name: string;
  email?: string | null;
  bio: string;
  dob?: string | null;
  location?: string | null;
  gender?: string | null;
  socialProfiles: Array<{ platform: string; username: string }>;
  is_private: number;
  email_notifications: number;
  created_at: string;
  isOwner: boolean;
  isAnonymous: boolean;
  publishedStories: Array<{
    id: number | string;
    title: string;
    description: string;
    snippet: string;
    story_type: string;
    reading_time_minutes: number;
    word_count: number;
    likes_count: number;
    created_at: string;
  }>;
}

export class ProfileService {
  /**
   * Fetch public or owner profile data by username
   */
  static async getProfileByUsername(
    username: string,
    currentUserId?: string | number | null,
    currentUserUsername?: string | null
  ): Promise<ProfileUserDTO | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT userid, username, email, name, bio, dob, location, gender, socialProfiles, is_private, email_notifications, created_at 
       FROM users 
       WHERE username = ?`,
      [username]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const rawUser = rows[0];

    const isOwner = Boolean(
      (currentUserId && String(currentUserId) === String(rawUser.userid)) ||
      (currentUserUsername && currentUserUsername.toLowerCase() === rawUser.username?.toLowerCase())
    );

    // Fetch published stories
    let publishedStories: ProfileUserDTO['publishedStories'] = [];
    try {
      const [storyRows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          id, 
          title, 
          description, 
          COALESCE(snippet, '') as snippet, 
          COALESCE(story_type, 'Article') as story_type, 
          COALESCE(reading_time_minutes, 1) as reading_time_minutes, 
          COALESCE(word_count, 0) as word_count, 
          COALESCE(likes_count, 0) as likes_count,
          created_at 
         FROM stories 
         WHERE userid = ? AND status = 1 
         ORDER BY created_at DESC`,
        [rawUser.userid]
      );

      publishedStories = (storyRows || []).map((s) => ({
        id: s.id,
        title: s.title?.trim() || 'Untitled Story',
        description: s.description || '',
        snippet:
          s.snippet ||
          s.description
            ?.replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200) ||
          'No preview available.',
        story_type: s.story_type || 'Article',
        reading_time_minutes: s.reading_time_minutes || 1,
        word_count: s.word_count || 0,
        likes_count: Number(s.likes_count || 0),
        created_at: s.created_at,
      }));
    } catch (storyErr) {
      console.error('Error fetching published stories for profile:', storyErr);
    }

    // Parse social profiles
    let socialProfiles: Array<{ platform: string; username: string }> = [];
    if (rawUser.socialProfiles) {
      try {
        const parsed = typeof rawUser.socialProfiles === 'string'
          ? JSON.parse(rawUser.socialProfiles)
          : rawUser.socialProfiles;
        if (Array.isArray(parsed)) {
          socialProfiles = parsed;
        }
      } catch {
        socialProfiles = [];
      }
    }

    const isPrivate = rawUser.is_private === 1 || rawUser.is_private === true;
    const isAnonymous = isPrivate && !isOwner;

    return {
      userid: isAnonymous ? null : rawUser.userid,
      username: isAnonymous ? 'unknown' : rawUser.username,
      name: isAnonymous ? 'Unknown' : (rawUser.name || rawUser.username || 'Author'),
      email: isAnonymous ? null : rawUser.email,
      bio: isAnonymous ? 'Unknown' : (rawUser.bio || ''),
      dob: isAnonymous ? null : (rawUser.dob || ''),
      location: isAnonymous ? null : (rawUser.location || ''),
      gender: isAnonymous ? null : (rawUser.gender || ''),
      socialProfiles: isAnonymous ? [] : socialProfiles,
      is_private: isPrivate ? 1 : 0,
      email_notifications: rawUser.email_notifications !== 0 ? 1 : 0,
      created_at: rawUser.created_at,
      isOwner,
      isAnonymous,
      publishedStories,
    };
  }

  /**
   * Update profile by user ID
   */
  static async updateProfile(
    userId: string | number,
    input: UpdateProfileInput
  ): Promise<{ success: boolean; message: string; profile: Partial<ProfileUserDTO> }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT userid, username, email, name, bio, dob, location, gender, socialProfiles, is_private, email_notifications 
       FROM users 
       WHERE userid = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw new Error('User profile not found');
    }

    const existing = rows[0];

    let updatedUsername = existing.username;
    if (input.username && input.username.toLowerCase() !== existing.username?.toLowerCase()) {
      const cleanUsername = input.username.trim();
      const [existingUser] = await pool.execute<RowDataPacket[]>(
        'SELECT userid FROM users WHERE LOWER(username) = LOWER(?) AND userid != ? LIMIT 1',
        [cleanUsername, userId]
      );
      if (existingUser && existingUser.length > 0) {
        throw new Error('Username is already taken by another account');
      }
      updatedUsername = cleanUsername;
    }

    const updatedName = input.name !== undefined ? input.name : existing.name;
    const updatedEmail = input.email !== undefined ? input.email : existing.email;
    const updatedDob = input.dob !== undefined ? (input.dob ? String(input.dob).slice(0, 10) : null) : existing.dob;
    const updatedLocation = input.location !== undefined ? (input.location || null) : existing.location;
    const updatedBio = input.bio !== undefined ? (input.bio || null) : existing.bio;
    const updatedGender = input.gender !== undefined ? (input.gender || null) : existing.gender;

    let updatedSocial: string;
    if (input.socialProfiles !== undefined) {
      const valid = input.socialProfiles.filter((s) => s && s.username && s.username.trim());
      updatedSocial = JSON.stringify(valid);
    } else {
      updatedSocial = typeof existing.socialProfiles === 'string'
        ? existing.socialProfiles
        : JSON.stringify(existing.socialProfiles || []);
    }

    const updatedPrivate = input.is_private !== undefined
      ? (input.is_private === true || input.is_private === 1 ? 1 : 0)
      : existing.is_private;

    const updatedNotifications = input.email_notifications !== undefined
      ? (input.email_notifications === false || input.email_notifications === 0 ? 0 : 1)
      : existing.email_notifications;

    await pool.execute<ResultSetHeader>(
      `UPDATE users 
       SET username = ?, name = ?, email = ?, dob = ?, location = ?, bio = ?, gender = ?, socialProfiles = ?, is_private = ?, email_notifications = ?, UPDATED_AT = NOW() 
       WHERE userid = ?`,
      [
        updatedUsername,
        updatedName,
        updatedEmail,
        updatedDob,
        updatedLocation,
        updatedBio,
        updatedGender,
        updatedSocial,
        updatedPrivate,
        updatedNotifications,
        userId,
      ]
    );

    return {
      success: true,
      message: 'Profile updated successfully',
      profile: {
        userid: Number(userId),
        username: updatedUsername,
        name: updatedName,
        email: updatedEmail,
        bio: updatedBio || '',
        dob: updatedDob || '',
        location: updatedLocation || '',
        gender: updatedGender || '',
        socialProfiles: JSON.parse(updatedSocial),
        is_private: updatedPrivate,
        email_notifications: updatedNotifications,
      },
    };
  }
}
