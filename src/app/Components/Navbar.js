// src/app/Components/Navbar.js
'use client'
import styles from '../Styles/Navbar.module.css';
import ThemeToggle from './Button-ThemeToggle'
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react'
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession()
  const [showMenu, setShowMenu] = useState(false);
  const handleMenuToggle = () => setShowMenu(prev => !prev);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
    setShowMenu(false)
  }

  // Show loading state
  if (status === 'loading') {
    return <nav className={styles.navbar}>Loading...</nav>
  }

  return (
    <nav className={styles.navbar}>
      <h1 className={styles.title}>Seeder</h1>
      <div className={styles.links}>
        <ThemeToggle />
        <Link href='/about' className={styles.link}>About</Link>
        {session?.user ? (
          <div style={{ position: "relative" }}>
            <div onClick={handleMenuToggle} className={styles.username}>
              {"u/" + (session.user.username || session.user.name)}
            </div>
            {showMenu && (
              <div className={styles.menu}>
                <div className={styles.menuLink}>Profile</div>
                <div className={styles.menuLink}>Settings</div>
                <div className={styles.menuLink} onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href='/auth/signin' className={styles.logsig}>Login or Signup</Link>
        )}
      </div>
      <div className={styles.loadingbar}></div>
    </nav>
  );
}