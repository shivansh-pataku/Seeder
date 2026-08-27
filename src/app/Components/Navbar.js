'use client'

import styles from '../Styles/Navbar.module.css';
import ThemeToggle from './Button-ThemeToggle'
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react'
import Link from "next/link";
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Folder01Icon, 
  InformationCircleIcon, 
  Task01Icon, 
  UserIcon, 
  Settings01Icon, 
  Logout01Icon, 
  Login01Icon 
} from '@hugeicons/core-free-icons';

export default function Navbar() {
  const { data: session, status } = useSession()
  const [showMenu, setShowMenu] = useState(false);
  const handleMenuToggle = () => setShowMenu(prev => !prev);
  const router = useRouter()

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
    setShowMenu(false)
  }

  const handleProfile = () => {
    setShowMenu(false)
    if (!session) {
      router.push('/auth/signin')
    } else {
      router.push(`/${session.user.username}`)
    }
  }

  const handleSettings = () => {
    setShowMenu(false)
    if (session) {
      router.push('/settings')
    } else {
      router.push('/auth/signin')
    }
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand} onClick={() => router.push('/')}>
        <HugeiconsIcon icon={Folder01Icon} size={18} className={styles.brandIcon} />
        <h1 className={styles.title}>Workspace</h1>
      </div>
      
      <div className={styles.links}>
        <ThemeToggle />
        
        <Link href='/about' className={styles.link}>
          <HugeiconsIcon icon={InformationCircleIcon} size={14} className={styles.linkIcon} />
          <span>About</span>
        </Link>
        
        {session?.user && (
          <Link href='/tasks' className={styles.link}>
            <HugeiconsIcon icon={Task01Icon} size={14} className={styles.linkIcon} />
            <span>Tasks</span>
          </Link>
        )}

        {session?.user ? (
          <div style={{ position: "relative" }}>
            <div onClick={handleMenuToggle} className={styles.username}>
              <HugeiconsIcon icon={UserIcon} size={14} className={styles.userIcon} />
              <span>{"u/" + (session.user.username || session.user.name)}</span>
            </div>
            {showMenu && (
              <div className={styles.menu}>
                <div className={styles.menuLink} onClick={handleProfile}>
                  <HugeiconsIcon icon={UserIcon} size={14} className={styles.dropdownIcon} />
                  <span>Profile</span>
                </div>
                <div className={styles.menuLink} onClick={handleSettings}>
                  <HugeiconsIcon icon={Settings01Icon} size={14} className={styles.dropdownIcon} />
                  <span>Settings</span>
                </div>
                <div className={styles.menuLink} onClick={handleLogout}>
                  <HugeiconsIcon icon={Logout01Icon} size={14} className={styles.dropdownIcon} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href='/auth/signin' className={styles.logsig}>
            <HugeiconsIcon icon={Login01Icon} size={14} className={styles.linkIcon} />
            <span>Login or Signup</span>
          </Link>
        )}
      </div>
      <div className={`${styles.loadingbar} ${status === 'loading' ? styles.active : ''}`}></div>
    </nav>
  );
}