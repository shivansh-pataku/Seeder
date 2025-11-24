'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from '../Styles/profile.module.css'
import { useParams } from 'next/navigation'



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
      router.push('/404') // Redirect to 404 or handle appropriately
      return
    }
  }, [username, router])

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
    github: { name: 'GitHub', url: 'https://github.com/', icon: '' },
    linkedin: { name: 'LinkedIn', url: 'https://linkedin.com/in/', icon: '' },
    twitter: { name: 'Twitter', url: 'https://twitter.com/', icon: '' },
    instagram: { name: 'Instagram', url: 'https://instagram.com/', icon: '' },
    reddit: { name: 'Reddit', url: 'https://reddit.com/u/', icon: '' },
    behance: { name: 'Behance', url: 'https://behance.net/', icon: '' },
    pinterest: { name: 'Pinterest', url: 'https://pinterest.com/', icon: '' },
    artstation: { name: 'ArtStation', url: 'https://artstation.com/', icon: '' }
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
      console.log('Fetching profile for:', username); // Debug log
      
      const response = await fetch(`/api/profile/${username}`)
      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data); // Debug log
        console.log('Social profiles from API:', data.profile.socialProfiles); // Debug log
        
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
          console.log('Setting profiles from API:', apiProfiles);
          setProfiles(apiProfiles);
        } else {
          console.log('No profiles from API, using default');
          setProfiles([{ platform: "github", username: "" }]);
        }
        
        setProfileNotFound(false);
      } else if (response.status === 404) {
        console.log('Profile not found');
        setProfileNotFound(true);
      } else {
        console.log('API error, status:', response.status);
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
    
    // if (!isOwnProfile) {
    //   alert('You can only edit your own profile!')
    //   return
    // }

    try {
      const validProfiles = profiles.filter(profile => profile.username.trim()) // Only include filled profiles which are 
      
      const dataToSave = {
        ...profiledata, // this is 
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

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingSpinner}>
          <h2>Loading profile...</h2>
        </div>
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
      {/* Profile Header */}
      <div className={styles.profile_A}>
        <div className={styles.profile_Aa}>
          <div className={styles.profile_cover}></div>
          <div className={styles.profile_bar}>
            <div className={styles.dp}>
              {/* <img 
                src={profiledata.avatar || session?.user?.image || '/default-avatar.png'} 
                alt="Profile"
                className={styles.profileImage}
              /> */}
            </div>
            <div className={styles.profileHeader}>
              <p className={styles.displayName}>{profiledata.name || username}</p>
              <p className={styles.username}>{username}</p>

            {isOwnProfile && (
              <div className={styles.profileActions}>
                {/* <span className={styles.ownProfileBadge}>Your Profile</span> */}
                <button 
                  className={styles.editToggleButton}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {/* {isEditing ? null : 'Edit Profile'} */} Edit
                </button>
              </div>
            )}
            </div>

          </div>
        </div>

        {/* Profile Content */}
        <div className={styles.profile_Ab}>
          <div className={styles.profile_card}>

            <p>Top-written contributions</p>


            {/* Edit Form - for own profile */}
            {isOwnProfile && isEditing && (
              <div className={styles.profileForm}>
                <form onSubmit={handleSave}>
                  <h3>Edit Profile Details</h3>
                  
                  <div className={styles.formItem}>
                    <label htmlFor="Name">Name</label>
                    <input 
                      type="text" 
                      id="Name" 
                      value={profiledata.name} 
                      onChange={(e) => handleProfileChange('name', e.target.value)} 
                      // defaultValue="something"
                    />
                  </div>

                  <div className={styles.formItem}>
                    <label htmlFor="dob">Born On</label>
                    <input type="date" id="dob"  value={profiledata.dob} onChange={(e) => handleProfileChange('dob', e.target.value)}/>
                  </div>

                  <div className={styles.formItem}> <label htmlFor="location">Location</label>
                    <input type="text" id="location" value={profiledata.location} onChange={(e) => handleProfileChange('location', e.target.value)} />
                  </div>

                  <div className={styles.formItem}>
                    <label htmlFor="bio">Bio</label>
                    <textarea id="bio" value={profiledata.bio} onChange={(e) => handleProfileChange('bio', e.target.value)} rows="4" />
                  </div>
                  

                  {/* Social Profiles Section */}
                  <div>
                    <h3>Add your profiles</h3>
                    {profiles.map((profile, index) => (
                      <div key={index} className={styles.formItem} style={{display: 'flex', flexDirection: 'row' }} >
                        
                        <select value={profile.platform} onChange={(e) => handleChange(index, "platform", e.target.value)}>
                          
                          {Object.keys(platforms).map((platform) => (
                            <option key={platform} value={platform}>
                              {platforms[platform].icon} {platform}
                            </option>
                          ))}

                        </select>

                        <input type="text"  placeholder="Username" value={profile.username} onChange={(e) => handleChange(index, "username", e.target.value)}/>

                        {profiles.length > 1 && (
                          <button type="button" onClick={() => removeSocialProfile(index)} className={styles.removeButton}> ✕ </button>
                        )}

                        {profile.username && platforms[profile.platform] && (
                          <span 
                          style={{ marginLeft: "1rem", color: "#007bff" }}
                          >
                            {platforms[profile.platform].url + profile.username}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={styles.buttons}>
                    <button type="submit" className={styles.saveButton}> Save </button>
                    <button type="button" className={styles.cancelButton} onClick={() => setIsEditing(false)} > Cancel </button>
                  </div>


                </form>
              </div>
            )}

            {/* {!isOwnProfile && (
              <div className={styles.visitorInfo}>
                <p>👀 You are viewing {profiledata.name || username}'s profile</p>
              </div>
            )} */}
          </div>
        </div>
      </div>

      {/* Side Profile Information */}
      <div className={styles.profile_B}>
        <div className={styles.introcard}>

          <h3>About {profiledata.name || username}</h3>

          <p className={styles.profile_item}>
            {profiledata.bio || 'No bio provided yet.'}
          </p>

                      {/* <h4>Profile Information</h4> */}
            {/* <p className={styles.profile_item}>
              <strong>Name:</strong> {profiledata.name || 'Not provided'}
            </p> */}
            <p className={styles.profile_item}>
              <strong>Born On:</strong> {profiledata.dob || 'N/A'}
            </p>
            <p className={styles.profile_item}>
              <strong>Location:</strong> {profiledata.location || 'N/A'}
            </p>
            <p className={styles.profile_item}>
              <strong>Member since:</strong> {profiledata.created_at ? 
                new Date(profiledata.created_at).toLocaleDateString() : 'Recently'}
            </p>


          {/* <div className={styles.profile_item}>
            <strong>Location:</strong> <span>{profiledata.location || 'Not specified'}</span>
          </div> */}
          
          {profiles.filter(p => p.username.trim()).length > 0 && (

            <div className={styles.profile_item}>
              <strong>Social Profiles:</strong>
              
                <div className={styles.socialLinksContainer}>
                  {profiles
                    .filter(p => p.username.trim())
                    .map((profile, index) => (
                      <a key={index} href={platforms[profile.platform].url + profile.username} target="_blank" rel="noopener noreferrer" className={styles.socialLink}> {platforms[profile.platform].icon} {platforms[profile.platform].name} </a>
                    ))}
                </div>

            </div>

          )}
 
        </div>
      </div>
    </div>
  )
}