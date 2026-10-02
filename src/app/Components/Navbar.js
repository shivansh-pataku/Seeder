'use client';

import styles from '../Styles/Navbar.module.css';
import ThemeToggle from './Button-ThemeToggle';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import LoadingBar from './LoadingBar';
import { useLoading } from './LoadingContext';
import { getGenderAvatar } from '../lib/avatar';
import {
  Article,
  User,
  Gear,
  SignOut,
  PencilSimple,
  Books,
} from '@phosphor-icons/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { startLoading, stopLoading } = useLoading();
  const [showMenu, setShowMenu] = useState(false);
  const menuContainerRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Hide navbar on login, signup, forgot-password, and reset-password screens
  const isAuthPage =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  // Synchronize loading bar
  useEffect(() => {
    if (status === 'loading') {
      startLoading();
    } else {
      stopLoading();
    }
  }, [status, startLoading, stopLoading]);

  // Click anywhere outside on screen to close the profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  if (isAuthPage) {
    return null;
  }

  const handleMenuToggle = () => setShowMenu((prev) => !prev);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
    setShowMenu(false);
  };

  const handleProfile = () => {
    setShowMenu(false);
    if (!session) {
      router.push('/auth/signin');
    } else {
      router.push(`/${session.user.username}`);
    }
  };

  const handleLibrary = () => {
    setShowMenu(false);
    if (session) {
      router.push('/library');
    } else {
      router.push('/auth/signin');
    }
  };

  const handleSettings = () => {
    setShowMenu(false);
    if (session) {
      router.push('/settings');
    } else {
      router.push('/auth/signin');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand} onClick={() => router.push('/')} title="Go to Home">
        {/* <div className={styles.logoSlot}>
          {!logoError ? (
            <Image
              src="/logo.png"
              alt="Logo"
              width={20}
              height={20}
              className={styles.brandLogo}
              onError={() => setLogoError(true)}
            />
          ) : null}
        </div> */}
        <h1 className={styles.title}>Meridian</h1>
      </div>

      <div className={styles.links}>
        {/* Changed 'About' to 'Our Story' without box borders */}
        <Link href="/about" className={`${styles.link} ${styles.ourStoryLink}`}>
          <span>Our Story</span>
        </Link>

        {session?.user && (
          <Link href="/desk" className={styles.link}>
            <Article size={14} weight="regular" className={styles.linkIcon} />
            <span>Desk</span>
          </Link>
        )}

        {session?.user && (
          <Link href="/desk/new" className={styles.newStoryBtn}>
            <PencilSimple size={14} weight="regular" />
            <span>Write</span>
          </Link>
        )}

        {session?.user ? (
          <div style={{ position: 'relative' }} ref={menuContainerRef}>
            <div onClick={handleMenuToggle} className={styles.username}>
              {getGenderAvatar(session.user?.gender) ? (
                <Image
                  src={getGenderAvatar(session.user.gender)}
                  alt="Avatar"
                  width={24}
                  height={24}
                  className={styles.navbarAvatar}
                />
              ) : (
                <User size={14} weight="regular" className={styles.userIcon} />
              )}
              <span className={styles.usernameText}>{'u/' + (session.user.username || session.user.name)}</span>
            </div>

            {showMenu && (
              <div className={styles.menu}>
                <div className={styles.menuLink} onClick={handleProfile}>
                  <User size={14} weight="regular" className={styles.dropdownIcon} />
                  <span>Profile</span>
                </div>

                <div className={styles.menuLink} onClick={handleLibrary}>
                  <Books size={14} weight="regular" className={styles.dropdownIcon} />
                  <span>Library</span>
                </div>

                <div className={styles.menuLink} onClick={handleSettings}>
                  <Gear size={14} weight="regular" className={styles.dropdownIcon} />
                  <span>Settings</span>
                </div>

                {/* Theme button inside directly imported inside  profile menu */}
                <ThemeToggle />

                {/* <div className={styles.menuDivider} /> */}

                <div className={styles.menuLink} onClick={handleLogout}>
                  <SignOut size={14} weight="regular" className={styles.dropdownIcon} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        ) : status === 'loading' ? null : (
          <Link href="/auth/signin" className={styles.logsig}>
            <span>Login | Register</span>
          </Link>
        )}
      </div>
      <LoadingBar />
    </nav>
  );
}