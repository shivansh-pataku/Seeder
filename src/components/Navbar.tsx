'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/Styles/Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LoadingBar from './LoadingBar';
import { useLoading } from './LoadingContext';
import { getGenderAvatar } from '@/lib/avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Article,
  User,
  Gear,
  SignOut,
  PencilSimple,
  Books,
  List,
  X,
  House,
  Info,
  CaretDown,
} from '@phosphor-icons/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { startLoading, stopLoading } = useLoading();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();

  const isAuthPage =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Synchronize loading bar
  useEffect(() => {
    if (status === 'loading') {
      startLoading();
    } else {
      stopLoading();
    }
  }, [status, startLoading, stopLoading]);

  if (isAuthPage) {
    return null;
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const currentUser = session?.user as any;
  const rawUsername = currentUser?.username || currentUser?.name;
  const userProfilePath = rawUsername
    ? `/${encodeURIComponent(String(rawUsername).trim())}`
    : '/auth/signin';
  const isLoggedOutHome = pathname === '/' && !currentUser && status !== 'loading';

  return (
    <nav className={styles.navbar} aria-label="Main Navigation">
      <Link href="/" className={styles.brand} title="Go to Home" aria-label="Meridian Home">
        <h1 className={styles.title}>Meridian</h1>
      </Link>

      {/* Desktop Navigation Links */}
      <div className={styles.desktopNav}>
        <Link href="/about" className={`${styles.link} ${styles.ourStoryLink}`}>
          <span>Our Story</span>
        </Link>

        {currentUser && (
          <Link href="/desk" className={styles.link}>
            <Article size={14} weight="regular" className={styles.linkIcon} />
            <span>Desk</span>
          </Link>
        )}

        {currentUser && (
          <Link href="/desk/new" className={styles.newStoryBtn}>
            <PencilSimple size={14} weight="regular" />
            <span>Write</span>
          </Link>
        )}

        {currentUser ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={styles.userTriggerBtn}
                aria-label="User Account Menu"
              >
                <div className={styles.userTriggerAvatar}>
                  {getGenderAvatar(currentUser?.gender) ? (
                    <Image
                      src={getGenderAvatar(currentUser.gender)!}
                      alt={`${currentUser.name || 'User'}'s avatar`}
                      width={22}
                      height={22}
                      className={styles.navbarAvatar}
                    />
                  ) : (
                    <User size={13} weight="bold" className={styles.userIcon} />
                  )}
                </div>
                <span className={styles.usernameText}>
                  {currentUser.username || currentUser.name}
                </span>
                <CaretDown size={11} weight="bold" className={styles.triggerChevron} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className={styles.menu}
                align="end"
                sideOffset={8}
                collisionPadding={12}
              >
                {/* User Identity Header Card */}
                <div className={styles.menuHeader}>
                  <div className={styles.menuHeaderAvatar}>
                    {getGenderAvatar(currentUser?.gender) ? (
                      <Image
                        src={getGenderAvatar(currentUser.gender)!}
                        alt={`${currentUser.name || 'User'}'s avatar`}
                        width={50}
                        height={50}
                        className={styles.menuHeaderAvatarImg}
                      />
                    ) : (
                      <div className={styles.menuHeaderAvatarPlaceholder}>
                        <User size={18} weight="regular" />
                      </div>
                    )}
                  </div>
                  <div className={styles.menuHeaderMeta}>
                    <span className={styles.menuHeaderName}>
                      {currentUser.name || currentUser.username || 'Writer'}
                    </span>
                    <span className={styles.menuHeaderHandle}>
                      @{currentUser.username || currentUser.name || 'user'}
                    </span>
                    {currentUser.email && (
                      <span className={styles.menuHeaderEmail} title={currentUser.email}>
                        {currentUser.email}
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu.Separator className={styles.menuSeparator} />

                {/* Primary Navigation Section */}
                <DropdownMenu.Group>
                  <DropdownMenu.Item asChild>
                    <Link href={userProfilePath} className={styles.menuItem}>
                      <User size={15} weight="regular" className={styles.menuItemIcon} />
                      <div className={styles.menuItemContent}>
                        <span className={styles.menuItemTitle}>Your Profile</span>
                      </div>
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild>
                    <Link href="/desk" className={styles.menuItem}>
                      <Article size={15} weight="regular" className={styles.menuItemIcon} />
                      <div className={styles.menuItemContent}>
                        <span className={styles.menuItemTitle}>Writer Desk</span>
                      </div>
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild>
                    <Link href="/desk/new" className={styles.menuItem}>
                      <PencilSimple size={15} weight="regular" className={styles.menuItemIcon} />
                      <div className={styles.menuItemContent}>
                        <span className={styles.menuItemTitle}>Write New Story</span>
                      </div>
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild>
                    <Link href="/library" className={styles.menuItem}>
                      <Books size={15} weight="regular" className={styles.menuItemIcon} />
                      <div className={styles.menuItemContent}>
                        <span className={styles.menuItemTitle}>Saved & Library</span>
                      </div>
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Group>

                <DropdownMenu.Separator className={styles.menuSeparator} />

                {/* Preferences Section */}
                <DropdownMenu.Group>
                  <DropdownMenu.Item asChild>
                    <Link href="/settings" className={styles.menuItem}>
                      <Gear size={15} weight="regular" className={styles.menuItemIcon} />
                      <div className={styles.menuItemContent}>
                        <span className={styles.menuItemTitle}>Settings & Account</span>
                      </div>
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild onSelect={(e) => e.preventDefault()}>
                    <ThemeToggle />
                  </DropdownMenu.Item>
                </DropdownMenu.Group>

                <DropdownMenu.Separator className={styles.menuSeparator} />

                {/* Logout Section */}
                <DropdownMenu.Group>
                  <DropdownMenu.Item
                    className={`${styles.menuItem} ${styles.menuItemLogout}`}
                    onSelect={handleLogout}
                  >
                    <SignOut size={15} weight="regular" className={styles.menuItemIcon} />
                    <div className={styles.menuItemContent}>
                      <span className={styles.menuItemTitle}>Sign Out</span>
                    </div>
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : status === 'loading' ? null : (
          <Link href="/auth/signin" className={styles.logsig}>
            <span>Login | Register</span>
          </Link>
        )}
      </div>

      {isLoggedOutHome && (
        <Link href="/auth/signin" className={styles.mobileAuthLink}>
          Login | Register
        </Link>
      )}

      {/* Mobile Hamburger Button & Drawer */}
      <Dialog.Root open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className={`${styles.hamburgerBtn} ${isLoggedOutHome ? styles.hamburgerHiddenOnHome : ''}`}
            aria-label="Open mobile menu"
            aria-expanded={mobileDrawerOpen}
          >
            <List size={18} weight="bold" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className={styles.drawerOverlay} />
          <Dialog.Content className={styles.drawerContent} aria-describedby={undefined}>
            <div className={styles.drawerHeader}>
              <Dialog.Title className={styles.drawerTitle}>Meridian</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  aria-label="Close menu"
                >
                  <X size={18} weight="bold" />
                </button>
              </Dialog.Close>
            </div>

            <div className={styles.drawerNav}>
              <Link
                href="/"
                className={styles.drawerLink}
                onClick={() => setMobileDrawerOpen(false)}
              >
                <House size={16} weight="regular" />
                <span>Home Feed</span>
              </Link>

              <Link
                href="/about"
                className={styles.drawerLink}
                onClick={() => setMobileDrawerOpen(false)}
              >
                <Info size={16} weight="regular" />
                <span>Our Story</span>
              </Link>

              {currentUser && (
                <>
                  <Link
                    href="/desk"
                    className={styles.drawerLink}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Article size={16} weight="regular" />
                    <span>Desk</span>
                  </Link>

                  <Link
                    href="/desk/new"
                    className={styles.drawerLink}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <PencilSimple size={16} weight="regular" />
                    <span>Write Story</span>
                  </Link>

                  <Link
                    href="/library"
                    className={styles.drawerLink}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Books size={16} weight="regular" />
                    <span>Library</span>
                  </Link>

                  <Link
                    href={userProfilePath}
                    className={styles.drawerLink}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <User size={16} weight="regular" />
                    <span>Profile (u/{currentUser.username || currentUser.name})</span>
                  </Link>

                  <Link
                    href="/settings"
                    className={styles.drawerLink}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <Gear size={16} weight="regular" />
                    <span>Settings</span>
                  </Link>
                </>
              )}
            </div>

            <div className={styles.drawerFooter}>
              <ThemeToggle />

              {currentUser ? (
                <button
                  type="button"
                  className={styles.drawerLink}
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleLogout();
                  }}
                >
                  <SignOut size={16} weight="regular" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className={styles.newStoryBtn}
                  style={{ justifyContent: 'center' }}
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <span>Login | Register</span>
                </Link>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <LoadingBar />
    </nav>
  );
}
