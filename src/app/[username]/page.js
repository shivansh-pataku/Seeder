'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from '../Styles/profile.module.css'
import { useParams, notFound } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  UserIcon, 
  Calendar01Icon, 
  Location01Icon, 
  PencilEdit01Icon, 
  LinkIcon, 
  GithubIcon, 
  LinkedinIcon, 
  NewTwitterIcon, 
  InstagramIcon, 
  RedditIcon, 
  BehanceIcon, 
  PinterestIcon,
  MailIcon,
  Calendar02Icon,
  CircleIcon,
  Cancel01Icon,
  SaveIcon
} from '@hugeicons/core-free-icons';

// Reserved routes that should NOT be treated as usernames
const RESERVED_ROUTES = [
  'api', 'auth', 'signin', 'signup', 'login', 'register',
  'dashboard', 'admin', 'settings', 'help', 'about',
  'contact', 'privacy', 'terms', 'blog', 'docs', 'support'
]

export default function ProfilePage() {
  const { data: session, status } = useSession()
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

  // Profile state
  const [profiledata, setProfileData] = useState({
    name: '',
    dob: '',
    location: '',
    bio: '',
    email: '',
    created_at: ''
  })

  // Social platforms configuration
  const platforms = {
    github: { name: 'GitHub', url: 'https://github.com/', icon: GithubIcon },
    linkedin: { name: 'LinkedIn', url: 'https://linkedin.com/in/', icon: LinkedinIcon },
    twitter: { name: 'Twitter', url: 'https://twitter.com/', icon: NewTwitterIcon },
    instagram: { name: 'Instagram', url: 'https://instagram.com/', icon: InstagramIcon },
    reddit: { name: 'Reddit', url: 'https://reddit.com/u/', icon: RedditIcon },
    behance: { name: 'Behance', url: 'https://behance.net/', icon: BehanceIcon },
    pinterest: { name: 'Pinterest', url: 'https://pinterest.com/', icon: PinterestIcon },
    artstation: { name: 'ArtStation', url: 'https://artstation.com/', icon: LinkIcon }
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
            dob: data.profile.dob ?? '',
            location: data.profile.location ?? '',
            bio: data.profile.bio ?? '',
            email: data.profile.email ?? '',
            created_at: data.profile.created_at ?? ''
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
    return (
      <div className="global-loader-container">
        <div className="global-loader-spinner"></div>
        <p className="global-loader-text">Loading Profile</p>
      </div>
    )
  }

  // Profile not found
  if (profileNotFound) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.notFound}>
          <h2>Profile Not Found</h2>
          <p>The profile &quot;@{username}&quot; doesn&apos;t exist.</p>
          <button onClick={() => router.push('/')} className={styles.goHomeButton}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.profilepageContainer}>
      {/* Profile Header & Main Content */}
      <div className={styles.profile_A}>
        <div className={styles.profile_Aa}>
          <div className={styles.profile_cover}></div>
          <div className={styles.profile_bar}>
            <div className={styles.dp}>
              <HugeiconsIcon icon={UserIcon} size={48} className={styles.avatarPlaceholderIcon} />
            </div>
            <div className={styles.profileHeader}>
              <div className={styles.identity}>
                <p className={styles.displayName}>{profiledata.name || username}</p>
                <p className={styles.username}>@{username}</p>
              </div>

              {isOwnProfile && (
                <div className={styles.profileActions}>
                  <button
                    className={styles.editToggleButton}
                    onClick={() => setIsEditing(true)}
                    title="Edit Profile"
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} size={14} style={{ marginRight: '6px' }} />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Activity Feed */}
        <div className={styles.profile_Ab}>
          <div className={styles.profile_card}>
            <div className={styles.cardHeader}>
              <HugeiconsIcon icon={CircleIcon} size={12} className={styles.liveIndicatorIcon} />
              <h3>Activity & Contributions</h3>
            </div>
            
            <div className={styles.contributionsFeed}>
              <div className={styles.contributionItem}>
                <div className={styles.contributionIcon}>
                  <HugeiconsIcon icon={Calendar02Icon} size={16} />
                </div>
                <div className={styles.contributionMeta}>
                  <p className={styles.contributionText}>Profile created successfully</p>
                  <span className={styles.contributionDate}>
                    {profiledata.created_at ? new Date(profiledata.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Profile Info Card */}
      <div className={styles.profile_B}>
        <div className={styles.introcard}>
          <h3 className={styles.sideTitle}>About</h3>
          
          <div className={styles.bioSection}>
            <p className={styles.bioText}>
              {profiledata.bio || 'No bio provided yet.'}
            </p>
          </div>

          <div className={styles.detailsSection}>
            {profiledata.dob && (
              <div className={styles.profile_item}>
                <HugeiconsIcon icon={Calendar01Icon} size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Born On</span>
                  <span className={styles.detailValue}>{profiledata.dob}</span>
                </div>
              </div>
            )}

            {profiledata.location && (
              <div className={styles.profile_item}>
                <HugeiconsIcon icon={Location01Icon} size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Location</span>
                  <span className={styles.detailValue}>{profiledata.location}</span>
                </div>
              </div>
            )}

            {profiledata.email && (
              <div className={styles.profile_item}>
                <HugeiconsIcon icon={MailIcon} size={16} className={styles.detailIcon} />
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Email</span>
                  <span className={styles.detailValue}>{profiledata.email}</span>
                </div>
              </div>
            )}

            <div className={styles.profile_item}>
              <HugeiconsIcon icon={Calendar02Icon} size={16} className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Joined</span>
                <span className={styles.detailValue}>
                  {profiledata.created_at ? new Date(profiledata.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Recently'}
                </span>
              </div>
            </div>
          </div>

          {profiles.filter(p => p.username.trim()).length > 0 && (
            <div className={styles.socialsSection}>
              <h4 className={styles.socialsTitle}>Social Connections</h4>
              <div className={styles.socialLinksContainer}>
                {profiles
                  .filter(p => p.username.trim())
                  .map((profile, index) => {
                    const platformMeta = platforms[profile.platform] || { name: profile.platform, url: '', icon: LinkIcon };
                    return (
                      <a 
                        key={index} 
                        href={platformMeta.url + profile.username} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.socialLink}
                      >
                        <HugeiconsIcon icon={platformMeta.icon} size={14} className={styles.socialLinkIcon} />
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
                            <HugeiconsIcon icon={Cancel01Icon} size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.buttons}>
                <button type="button" className={styles.cancelButton} onClick={() => setIsEditing(false)}>
                  <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ marginRight: '6px' }} />
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  <HugeiconsIcon icon={SaveIcon} size={14} style={{ marginRight: '6px' }} />
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