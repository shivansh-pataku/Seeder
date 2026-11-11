import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProfileService } from '@/app/api/(modules)/profile/profile.service';
import ProfileClient, { ProfileData } from '@/components/Profile/ProfileClient';

export const dynamic = 'force-dynamic';

const RESERVED_ROUTES = [
  'api', 'auth', 'signin', 'signup', 'login', 'register',
  'dashboard', 'admin', 'settings', 'help', 'about',
  'contact', 'privacy', 'terms', 'blog', 'docs', 'support',
  'desk', 'read', 'library',
];

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername).trim();

  if (RESERVED_ROUTES.includes(username.toLowerCase())) {
    return { title: 'Not Found | Meridian' };
  }

  try {
    const profile = await ProfileService.getProfileByUsername(username);
    if (!profile) {
      return { title: 'User Not Found | Meridian' };
    }

    const displayName = profile.isAnonymous ? 'Unknown' : profile.name || username;
    return {
      title: `${displayName} (@${profile.username}) | Meridian`,
      description: profile.bio || `Read stories by ${displayName} on Meridian.`,
    };
  } catch {
    return { title: `@${username} | Meridian` };
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername).trim();

  if (RESERVED_ROUTES.includes(username.toLowerCase())) {
    notFound();
  }

  const session = await auth();
  const currentUserId = session?.user?.id;
  const currentUsername = (session?.user as any)?.username || session?.user?.name;

  let profileDTO;
  try {
    profileDTO = await ProfileService.getProfileByUsername(
      username,
      currentUserId,
      currentUsername
    );
  } catch (error) {
    console.error('Error fetching profile in RSC:', error);
  }

  if (!profileDTO) {
    return <ProfileClient username={username} />;
  }

  const formatDateField = (val: unknown): string => {
    if (!val) return '';
    if (val instanceof Date) return val.toISOString();
    return String(val);
  };

  const formatDobField = (val: unknown): string => {
    if (!val) return '';
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    return String(val).slice(0, 10);
  };

  const profileData: ProfileData = {
    name: profileDTO.name,
    username: profileDTO.username,
    dob: formatDobField(profileDTO.dob),
    gender: profileDTO.gender || '',
    location: profileDTO.location || '',
    bio: profileDTO.bio || '',
    email: profileDTO.email || '',
    created_at: formatDateField(profileDTO.created_at),
    is_private: profileDTO.is_private,
    isAnonymous: profileDTO.isAnonymous,
    publishedStories: (profileDTO.publishedStories || []).map((s) => ({
      ...s,
      created_at: formatDateField(s.created_at),
    })),
    email_notifications: profileDTO.email_notifications,
    socialProfiles: profileDTO.socialProfiles,
  };

  return (
    <ProfileClient
      initialProfile={profileData}
      initialIsOwner={profileDTO.isOwner}
      username={username}
    />
  );
}
