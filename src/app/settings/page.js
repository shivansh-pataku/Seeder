'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from '../Styles/settings.module.css'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/settings')
    } else if (status !== 'loading') {
      setLoading(false)
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loading_container}>
        {/* <div className={styles.spinner}></div>
        <p>Verifying access...</p> */}
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.error_container}>
        <h2>🚫 Access Denied</h2>
        <p>Please sign in to access settings.</p>
        <button onClick={() => router.push('/auth/signin')}>
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className={styles.settingsPageContainer}>
      
      <div className={styles.settings_A}>
        
        <div className={styles.settings_header}>
          <h1 className={styles.settings_title}>Settings</h1>
          <p className={styles.settings_subtitle}>
            Welcome, {session.user?.name || session.user?.email}
          </p>
        </div>

        <div className={styles.settings_content}>

          <div className={styles.settings_gridk}>
            
            {/* <div className={styles.setting_card}>
              <h3>Appearance</h3>
              <div className={styles.setting_item}>
                <label>Theme</label>
                <select>
                  <option>Light</option>
                  <option>Dark</option>
                  <option>Auto</option>
                </select>
              </div>
            </div> */}

            {/* \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */}

            <div className={styles.setting_card}> 
              <h3>Notifications</h3>
              <div className={styles.setting_item}>
                <div className={styles.Label} >Email notifications</div>
                <label className={styles.switch}>
                  <input type="checkbox" defaultChecked />
                  {/* Email notifications */}
                  <span className={styles.slider}>  </span>
                </label>

              </div>
            </div>

            <div className={styles.setting_card}>
              <h3>Privacy</h3>
              <div className={styles.setting_item}>
                <div className={styles.Label} >Public profile</div>
                <label className={styles.switch}>
                  <input type="checkbox" defaultChecked />
                  {/* Public profile */}
                  <span className={styles.slider}>  </span>
                </label>
                
              </div>
            </div>

            <div className={styles.setting_card}>
              <h3>Data</h3>
              <div className={styles.setting_item}>
                <button className={styles.danger_button}>
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  )
}