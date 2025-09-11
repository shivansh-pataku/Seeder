// src/app/profile/page.js
'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from '../Styles/profile.module.css'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to signin with callback
      router.push('/auth/signin?callbackUrl=/profile')
    } else if (status !== 'loading') {
      setLoading(false)
    }
  }, [status, router])

  // Show loading while checking session
  if (status === 'loading' || loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingSpinner}>
          <h2>Loading profile...</h2>
        </div>
      </div>
    )
  }

  // Show error if somehow no session (middleware should prevent this)
  // if (!session?.user) {
  //   return (
  //     <div className={styles.profileContainer}>
  //       <h2 className={styles.profileTitle}>Access Denied</h2>
  //       <p className={styles.profileInfo}>Please sign in to view your profile.</p>
  //       <button 
  //         onClick={() => router.push('/auth/signin')}
  //         className={styles.signinButton}
  //       >
  //         Go to Sign In
  //       </button>
  //     </div>
  //   )
  // }

  // Show profile with session data
  return (
    <div className={styles.profilepageContainer}>

          <div className={styles.profile_A}>

              <div className={styles.profile_Aa}>

                    <div className={styles.profile_cover}>
                      {/* <h2>Cover Photo Area</h2> */}
                    </div>

                    <div className={styles.profile_bar}>
                      <div className={styles.dp}>
                        {/* add image here */}
                      </div>
                      {/* <h3>{session.user?.name || session.user?.email}</h3> */}
                      <p className={styles.username}>\u {session.user?.username || 'user'}</p>
                    </div>

              </div>

              <div className={styles.profile_Ab}>

                  <div className={styles.profile_card}>
                    <h4>Profile Information</h4>
                    <p className={styles.profile_item}><strong>Email:</strong> {session.user?.email}</p>
                    <p className={styles.profile_item}><strong>User ID:</strong> {session.user?.id || 'N/A'}</p>
                    <p className={styles.profile_item}><strong>Role:</strong> {session.user?.role || 'User'}</p>
                    <p className={styles.profile_item}><strong>Member since:</strong> Recently</p>

                  </div>
              </div>

          </div>

{/* ///////////////////////////////////////////////////// */}

          <div className={styles.profile_B}>

            <div className={styles.introcard}>
              <h3>About Me</h3>
              <p className={styles.profile_item}>Fullstack Developer, Designer and exploring AI and intigration.</p>
              <div className={styles.profile_item}>Location <p>Sissu</p></div>
              <p className={styles.profile_item}>Profiles <a href="https://www.linkedin.com/in/shivansh-pataku-511611165">Linkedin</a></p>
              {/* <p>Joined: Recently</p> */}
            </div>


            </div>

  </div>
  )
}