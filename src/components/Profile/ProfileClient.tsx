'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '@/app/Styles/profile.module.css';
import { useInkWell } from '@/components/InkWell';
import { getGenderAvatar } from '@/lib/avatar';
import { StoryProfileCard, StoryProfileItem } from '@/components/Stories';
import { formatDateMonthYear } from '@/lib/date';
import * as Dialog from '@radix-ui/react-dialog';
import {
  User,
  Calendar,
  MapPin,
  PencilSimple,
  LinkSimple,
  GithubLogo,
  LinkedinLogo,
  XLogo,
  InstagramLogo,
  RedditLogo,
  BehanceLogo,
  PinterestLogo,
  EnvelopeSimple,
  X,
  FloppyDisk,
} from '@phosphor-icons/react';

export interface SocialProfile {
  platform: string;
  username: string;
}

export interface ProfileData {
  name: string;
  username?: string;
  dob: string;
  gender: string;
  location: string;
  bio: string;
  email: string;
  created_at: string;
  is_private?: number;
  isAnonymous?: boolean;
  publishedStories?: StoryProfileItem[];
  email_notifications?: boolean | number;
  socialProfiles?: SocialProfile[];
}

export interface ProfileClientProps {
  initialProfile?: ProfileData | null;
  initialIsOwner?: boolean;
  username: string;
}

const platforms: Record<string, { name: string; url: string; icon: React.ComponentType<any> }> = {
  github: { name: 'GitHub', url: 'https://github.com/', icon: GithubLogo },
  linkedin: { name: 'LinkedIn', url: 'https://linkedin.com/in/', icon: LinkedinLogo },
  twitter: { name: 'Twitter', url: 'https://twitter.com/', icon: XLogo },
  instagram: { name: 'Instagram', url: 'https://instagram.com/', icon: InstagramLogo },
  reddit: { name: 'Reddit', url: 'https://reddit.com/u/', icon: RedditLogo },
  behance: { name: 'Behance', url: 'https://behance.net/', icon: BehanceLogo },
  pinterest: { name: 'Pinterest', url: 'https://pinterest.com/', icon: PinterestLogo },
  artstation: { name: 'ArtStation', url: 'https://artstation.com/', icon: LinkSimple },
};

export default function ProfileClient({
  initialProfile,
  initialIsOwner = false,
  username,
}: ProfileClientProps) {
  const { update } = useSession();
  const router = useRouter();
  const inkWell = useInkWell();

  const [isOwnProfile] = useState(initialIsOwner);
  const [isEditing, setIsEditing] = useState(false);
  const [profiledata, setProfileData] = useState<ProfileData>(
    initialProfile || {
      name: '',
      username,
      dob: '',
      gender: '',
      location: '',
      bio: '',
      email: '',
      created_at: '',
      publishedStories: [],
    }
  );
  const [notFoundState] = useState(!initialProfile);

  const initialSocials =
    initialProfile &&
    Array.isArray(initialProfile.socialProfiles) &&
    initialProfile.socialProfiles.length > 0
      ? initialProfile.socialProfiles
      : [{ platform: 'github', username: '' }];

  const [profiles, setProfiles] = useState<SocialProfile[]>(initialSocials);

  // Handle profile input changes
  const handleChange = (index: number, field: 'platform' | 'username', value: string) => {
    const updated = [...profiles];
    updated[index][field] = value;
    setProfiles(updated);

    if (index === profiles.length - 1 && updated[index].username.trim() !== '') {
      setProfiles([...updated, { platform: 'github', username: '' }]);
    }
  };

  // Handle profile data changes
  const handleProfileChange = (field: keyof ProfileData, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Remove social profile
  const removeSocialProfile = (index: number) => {
    if (profiles.length > 1) {
      setProfiles(profiles.filter((_, i) => i !== index));
    }
  };

  // Handle form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validProfiles = profiles.filter((profile) => profile.username.trim());

      const dataToSave = {
        ...profiledata,
        socialProfiles: validProfiles,
      };

      const response = await fetch(`/api/profile/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        const resData = await response.json();
        const updated = resData.data?.profile || resData.profile || dataToSave;

        setProfileData((prev) => ({
          ...prev,
          name: updated.name ?? prev.name,
          email: updated.email ?? prev.email,
          bio: updated.bio ?? prev.bio,
          location: updated.location ?? prev.location,
          dob: updated.dob ?? prev.dob,
          gender: updated.gender ?? prev.gender,
          is_private: updated.is_private ?? prev.is_private,
          email_notifications: updated.email_notifications ?? prev.email_notifications,
        }));

        if (Array.isArray(updated.socialProfiles)) {
          setProfiles(
            updated.socialProfiles.length > 0
              ? updated.socialProfiles
              : [{ platform: 'github', username: '' }]
          );
        }

        if (typeof update === 'function' && isOwnProfile) {
          try {
            await update({ gender: updated.gender, name: updated.name });
          } catch (updateErr) {
            console.warn('Session update failed:', updateErr);
          }
        }

        inkWell.toast({
          message: 'Profile updated successfully!',
          type: 'success',
        });
        setIsEditing(false);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || errData.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      inkWell.toast({
        message: error.message || 'Failed to save profile',
        type: 'error',
      });
    }
  };

  if (notFoundState) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundCard}>
          <div className={styles.notFoundIconBadge}>
            <User size={36} weight="regular" className={styles.notFoundIcon} />
          </div>

          <div className={styles.notFoundText}>
            <span className={styles.notFoundTag}>404 — User Not Found</span>
            <h2 className={styles.notFoundTitle}>Profile Not Found</h2>
            <p className={styles.notFoundDescription}>
              The profile <span className={styles.notFoundUsername}>@{username}</span> could not be found. The user might have changed their username or the account doesn&apos;t exist.
            </p>
          </div>

          <div className={styles.notFoundActions}>
            <button
              type="button"
              onClick={() => router.push('/desk')}
              className={styles.notFoundPrimaryBtn}
            >
              Go to Desk
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.notFoundSecondaryBtn}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilepageContainer}>
      <div className={styles.profile_A}>
        <div className={styles.profile_Aa}>
          <div className={styles.profile_cover}></div>
          <div className={styles.profile_bar}>
            <div className={styles.dp}>
              {!profiledata.isAnonymous && getGenderAvatar(profiledata.gender) ? (
                <Image
                  src={getGenderAvatar(profiledata.gender)!}
                  alt={`${profiledata.isAnonymous ? 'Unknown' : (profiledata.name || username)}'s avatar`}
                  width={92}
                  height={92}
                  className={styles.avatarImg}
                  priority
                />
              ) : (
                <User size={48} weight="regular" className={styles.avatarPlaceholderIcon} />
              )}
            </div>
            <div className={styles.profileHeader}>
              <div className={styles.identity}>
                <p className={styles.displayName}>
                  {profiledata.isAnonymous ? 'Unknown' : (profiledata.name || username)}
                </p>
                <p className={styles.username}>
                  @{profiledata.isAnonymous ? 'unknown' : (profiledata.username || username)}
                </p>
              </div>

              {isOwnProfile && (
                <div className={styles.profileActions}>
                  <button
                    className={styles.editToggleButton}
                    onClick={() => router.push('/settings')}
                    title="Edit Profile"
                  >
                    <PencilSimple size={14} weight="regular" style={{ marginRight: '6px' }} />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.profile_Ab}>
          <div className={styles.profile_card}>
            <div className={styles.cardHeader}>
              <PencilSimple size={15} weight="regular" className={styles.headerIcon} />
              <h3>Published Stories ({profiledata.publishedStories?.length || 0})</h3>
            </div>

            {profiledata.publishedStories && profiledata.publishedStories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {profiledata.publishedStories.map((story) => (
                  <StoryProfileCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <p className={styles.emptyStoriesText}>
                {isOwnProfile
                  ? 'You have not published any stories yet. Go to your Desk to publish one!'
                  : 'No published stories yet.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.profile_B}>
        <div className={styles.introcard}>
          <h3 className={styles.sideTitle}>About</h3>

          <div className={styles.bioSection}>
            <p className={styles.bioText}>
              {profiledata.isAnonymous ? 'Unknown' : (profiledata.bio || 'No bio provided yet.')}
            </p>
          </div>

          {!profiledata.isAnonymous && (
            <div className={styles.detailsSection}>
              {profiledata.dob && (
                <div className={styles.profile_item}>
                  <Calendar size={16} weight="regular" className={styles.detailIcon} />
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Born On</span>
                    <span className={styles.detailValue}>
                      {typeof profiledata.dob === 'string'
                        ? profiledata.dob
                        : (profiledata.dob as any) instanceof Date
                          ? (profiledata.dob as any).toISOString().slice(0, 10)
                          : String(profiledata.dob || '')}
                    </span>
                  </div>
                </div>
              )}

              {profiledata.gender && (
                <div className={styles.profile_item}>
                  <User size={16} weight="regular" className={styles.detailIcon} />
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Gender</span>
                    <span className={styles.detailValue}>
                      {profiledata.gender.toLowerCase() === 'male'
                        ? 'Male'
                        : profiledata.gender.toLowerCase() === 'female'
                          ? 'Female'
                          : profiledata.gender.toLowerCase() === 'prefer_not_to_say'
                            ? 'Prefer not to say'
                            : profiledata.gender.charAt(0).toUpperCase() + profiledata.gender.slice(1)}
                    </span>
                  </div>
                </div>
              )}

              {profiledata.location && (
                <div className={styles.profile_item}>
                  <MapPin size={16} weight="regular" className={styles.detailIcon} />
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.detailValue}>{profiledata.location}</span>
                  </div>
                </div>
              )}

              {profiledata.email && (
                <div className={styles.profile_item}>
                  <EnvelopeSimple size={16} weight="regular" className={styles.detailIcon} />
                  <div className={styles.detailContent}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{profiledata.email}</span>
                  </div>
                </div>
              )}

              <div className={styles.profile_item}>
                <Calendar size={16} weight="regular" className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Joined</span>
                  <span className={styles.detailValue}>
                    {profiledata.created_at
                      ? formatDateMonthYear(profiledata.created_at)
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!profiledata.isAnonymous && profiles.filter((p) => p.username.trim()).length > 0 && (
            <div className={styles.socialsSection}>
              <h4 className={styles.socialsTitle}>Social Connections</h4>
              <div className={styles.socialLinksContainer}>
                {profiles
                  .filter((p) => p.username.trim())
                  .map((profile, index) => {
                    const platformMeta = platforms[profile.platform] || {
                      name: profile.platform,
                      url: '',
                      icon: LinkSimple,
                    };
                    const PlatformIcon = platformMeta.icon;
                    return (
                      <a
                        key={index}
                        href={platformMeta.url + profile.username}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                      >
                        <PlatformIcon size={14} weight="regular" className={styles.socialLinkIcon} />
                        <span>{platformMeta.name}</span>
                      </a>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <Dialog.Root open={isEditing} onOpenChange={setIsEditing}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.modalOverlay} />
            <Dialog.Content className={styles.profileForm} aria-describedby={undefined}>
              <Dialog.Title asChild>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem' }}>
                  Edit Profile
                </h2>
              </Dialog.Title>
              <form onSubmit={handleSave}>
                <div className={styles.formColumns}>
                  <div className={styles.formColumnLeft}>
                    <h3>Edit Profile Details</h3>

                    <div className={styles.formItem}>
                      <label htmlFor="Name">Display Name</label>
                      <input
                        type="text"
                        id="Name"
                        value={profiledata.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        placeholder="Your Name"
                      />
                    </div>

                    <div className={styles.formItem}>
                      <label htmlFor="dob">Date of Birth</label>
                      <input
                        type="date"
                        id="dob"
                        value={profiledata.dob}
                        onChange={(e) => handleProfileChange('dob', e.target.value)}
                      />
                    </div>

                    <div className={styles.formItem}>
                      <label htmlFor="gender">Gender</label>
                      <select
                        id="gender"
                        value={profiledata.gender || ''}
                        onChange={(e) => handleProfileChange('gender', e.target.value)}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className={styles.formItem}>
                      <label htmlFor="location">Location</label>
                      <input
                        type="text"
                        id="location"
                        value={profiledata.location}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>

                    <div className={styles.formItem}>
                      <label htmlFor="bio">About Bio</label>
                      <textarea
                        id="bio"
                        value={profiledata.bio}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        rows={4}
                        placeholder="Tell the world about yourself..."
                      />
                    </div>
                  </div>

                  <div className={styles.formColumnRight}>
                    <h3>Social Links</h3>

                    <div className={styles.socialListContainer}>
                      {profiles.map((profile, index) => (
                        <div key={index} className={styles.socialRow}>
                          <select
                            value={profile.platform}
                            onChange={(e) => handleChange(index, 'platform', e.target.value)}
                          >
                            {Object.keys(platforms).map((platform) => (
                              <option key={platform} value={platform}>
                                {platforms[platform].name}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            placeholder="Username"
                            value={profile.username}
                            onChange={(e) => handleChange(index, 'username', e.target.value)}
                          />

                          {profiles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSocialProfile(index)}
                              className={styles.removeButton}
                            >
                              <X size={14} weight="regular" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.buttons}>
                  <button type="button" className={styles.cancelButton} onClick={() => setIsEditing(false)}>
                    <X size={14} weight="regular" style={{ marginRight: '6px' }} />
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveButton}>
                    <FloppyDisk size={14} weight="regular" style={{ marginRight: '6px' }} />
                    Save Changes
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
