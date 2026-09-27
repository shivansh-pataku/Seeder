'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from '../Styles/profile.module.css'
import { useParams, notFound } from 'next/navigation'
import { useLoading } from '../Components/LoadingContext'
import { getGenderAvatar } from '../lib/avatar'
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
  FloppyDisk
} from '@phosphor-icons/react';

// Reserved routes that should NOT be treated as usernames
const RESERVED_ROUTES = [
  'api', 'auth', 'signin', 'signup', 'login', 'register',
  'dashboard', 'admin', 'settings', 'help', 'about',
  'contact', 'privacy', 'terms', 'blog', 'docs', 'support'
]

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const { startLoading, stopLoading } = useLoading()
  const router = useRouter()
  const { username } = useParams()

  // Check if username is a reserved route
  useEffect(() => {
    if (username && RESERVED_ROUTES.includes(username.toLowerCase())) {
      notFound()
    }
  }, [username])

  // State management
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [profileNotFound, setProfileNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  // Synchronize loading with top linear progress indicator
  useEffect(() => {
    if (status === 'loading' || loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [status, loading, startLoading, stopLoading])

  // Profile state
  const [profiledata, setProfileData] = useState({
    name: '',
    dob: '',
    gender: '',
    location: '',
    bio: '',
    email: '',
    created_at: ''
  })

  // Social platforms configuration
  const platforms = {
    github: { name: 'GitHub', url: 'https://github.com/', icon: GithubLogo },
    linkedin: { name: 'LinkedIn', url: 'https://linkedin.com/in/', icon: LinkedinLogo },
    twitter: { name: 'Twitter', url: 'https://twitter.com/', icon: XLogo },
    instagram: { name: 'Instagram', url: 'https://instagram.com/', icon: InstagramLogo },
    reddit: { name: 'Reddit', url: 'https://reddit.com/u/', icon: RedditLogo },
    behance: { name: 'Behance', url: 'https://behance.net/', icon: BehanceLogo },
    pinterest: { name: 'Pinterest', url: 'https://pinterest.com/', icon: PinterestLogo },
    artstation: { name: 'ArtStation', url: 'https://artstation.com/', icon: LinkSimple }
  }

  const [profiles, setProfiles] = useState([{ platform: "github", username: "" }])

  // Check if user owns this profile
  useEffect(() => {
    if (session?.user && username) {
      // Generate current user's username from session
      const currentUserUsername = session.user.name?.toLowerCase().replace(/\s+/g, '') ||
        session.user.email?.split('@')[0]?.toLowerCase()

      setIsOwnProfile(currentUserUsername === username.toLowerCase())
    }
  }, [session, username])

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username || RESERVED_ROUTES.includes(username.toLowerCase())) return

      try {
        setLoading(true)
        console.log('Fetching profile for:', username);

        const response = await fetch(`/api/profile/${username}`)
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('API Response data:', data);

          setProfileData({
            name: data.profile.name ?? '',
            username: data.profile.username ?? username,
            dob: data.profile.dob ?? '',
            gender: data.profile.gender ?? '',
            location: data.profile.location ?? '',
            bio: data.profile.bio ?? '',
            email: data.profile.email ?? '',
            created_at: data.profile.created_at ?? '',
            is_private: data.profile.is_private ?? 0,
            isAnonymous: Boolean(data.profile.isAnonymous),
            publishedStories: data.profile.publishedStories || []
          });

          // Handle profiles properly
          const apiProfiles = data.profile.socialProfiles;
          if (Array.isArray(apiProfiles) && apiProfiles.length > 0) {
            setProfiles(apiProfiles);
          } else {
            setProfiles([{ platform: "github", username: "" }]);
          }

          setProfileNotFound(false);
        } else if (response.status === 404) {
          setProfileNotFound(true);
        } else {
          throw new Error(`API returned ${response.status}`);
        }
      } catch (error) {
        console.error('Fetch profile error:', error);
        setProfileNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile()
  }, [username])

  // Handle profile input changes
  const handleChange = (index, field, value) => {
    const updated = [...profiles]
    updated[index][field] = value
    setProfiles(updated)

    if (index === profiles.length - 1 && updated[index].username.trim() !== "") {
      setProfiles([...updated, { platform: "github", username: "" }])
    }
  }

  // Handle profile data changes
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Remove social profile
  const removeSocialProfile = (index) => {
    if (profiles.length > 1) {
      setProfiles(profiles.filter((_, i) => i !== index))
    }
  }

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault()

    try {
      const validProfiles = profiles.filter(profile => profile.username.trim())

      const dataToSave = {
        ...profiledata,
        socialProfiles: validProfiles
      }

      const response = await fetch(`/api/profile/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (response.ok) {
        if (typeof update === 'function' && isOwnProfile) {
          try {
            await update({ gender: dataToSave.gender });
          } catch (updateErr) {
            console.warn('Session update failed:', updateErr);
          }
        }
        alert('Profile updated successfully!')
        setIsEditing(false)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save profile')
    }
  }

  if (status === 'loading' || loading) {
    return null;
  }

  // Profile not found
  if (profileNotFound) {
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
      {/* Profile Header & Main Content */}
      <div className={styles.profile_A}>
        <div className={styles.profile_Aa}>
          <div className={styles.profile_cover}></div>
          <div className={styles.profile_bar}>
            <div className={styles.dp}>
              {!profiledata.isAnonymous && getGenderAvatar(profiledata.gender) ? (
                <Image
                  src={getGenderAvatar(profiledata.gender)}
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
                    title="Edit Profile in Settings"
                  >
                    <PencilSimple size={14} weight="regular" style={{ marginRight: '6px' }} />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Published Stories Section */}
        <div className={styles.profile_Ab}>
          <div className={styles.profile_card}>
            <div className={styles.cardHeader}>
              <PencilSimple size={15} weight="regular" className={styles.headerIcon} />
              <h3>Published Stories ({profiledata.publishedStories?.length || 0})</h3>
            </div>

              {profiledata.publishedStories && profiledata.publishedStories.length > 0 ? (
              <div className={styles.storiesGrid}>
                {profiledata.publishedStories.map((story) => {
                  const plainText = (story.description || '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
                  const readTimeMin = Math.max(1, Math.ceil(words / 200));

                  return (
                    <div
                      key={story.id}
                      className={`${styles.profileStoryCard} ${isOwnProfile ? styles.editable : ''}`}
                      onClick={() => {
                        if (isOwnProfile) {
                          router.push(`/desk/${story.id}`);
                        } else {
                          router.push(`/read/${story.id}`);
                        }
                      }}
                      title={isOwnProfile ? "Click to edit in Desk" : "Click to read story"}
                    >
                      {/* Top Banner Row: Story Tag on Left, Date on Right */}
                      <div className={styles.storyCardHeaderRow}>
                        <span className={styles.storyBadge}>Story</span>
                        <span className={styles.storyDate}>
                          {story.created_at
                            ? new Date(story.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Published'}
                        </span>
                      </div>

                      {/* Main Banner Content */}
                      <div className={styles.storyCardTop}>
                        <h4 className={styles.storyCardTitle}>
                          {story.title?.trim() || 'Untitled Story'}
                        </h4>
                        <p className={styles.storyCardSnippet}>
                          {plainText || 'No description provided.'}
                        </p>
                      </div>

                      {/* Banner Footer Bar */}
                      <div className={styles.storyCardFooter}>
                        <div className={styles.storyMeta}>
                          <span>{words > 0 ? `${words} words` : 'Short read'}</span>
                          <span className={styles.metaDot}>•</span>
                          <span>{readTimeMin} min read</span>
                        </div>

                        <div>
                          {isOwnProfile ? (
                            <span className={styles.editBadge}>
                              Edit in Desk →
                            </span>
                          ) : (
                            <span className={styles.readBadge}>
                              Read story →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {/* Side Profile Info Card */}
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
                    <span className={styles.detailValue}>{profiledata.dob}</span>
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
                    {profiledata.created_at ? new Date(profiledata.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!profiledata.isAnonymous && profiles.filter(p => p.username.trim()).length > 0 && (
            <div className={styles.socialsSection}>
              <h4 className={styles.socialsTitle}>Social Connections</h4>
              <div className={styles.socialLinksContainer}>
                {profiles
                  .filter(p => p.username.trim())
                  .map((profile, index) => {
                    const platformMeta = platforms[profile.platform] || { name: profile.platform, url: '', icon: LinkSimple };
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

      {/* Edit Profile Modal */}
      {isOwnProfile && isEditing && (
        <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div className={styles.profileForm} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className={styles.formColumns}>
                {/* Left Column: Basic Details */}
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
                      rows="4" 
                      placeholder="Tell the world about yourself..."
                    />
                  </div>
                </div>

                {/* Right Column: Social profiles */}
                <div className={styles.formColumnRight}>
                  <h3>Social Links</h3>

                  <div className={styles.socialListContainer}>
                    {profiles.map((profile, index) => (
                      <div key={index} className={styles.socialRow}>
                        <select 
                          value={profile.platform} 
                          onChange={(e) => handleChange(index, "platform", e.target.value)}
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
                          onChange={(e) => handleChange(index, "username", e.target.value)} 
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
          </div>
        </div>
      )}
    </div>
  )
}