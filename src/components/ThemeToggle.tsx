'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from '@phosphor-icons/react';
import styles from '@/app/Styles/Navbar.module.css';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.menuItem} role="button" tabIndex={0}>
        <Sun size={15} weight="regular" className={styles.menuItemIcon} />
        <div className={styles.menuItemContent}>
          <span className={styles.menuItemTitle}>Appearance</span>
        </div>
      </div>
    );
  }

  const currentTheme = resolvedTheme || theme || 'light';
  const isDark = currentTheme === 'dark';

  return (
    <div
      className={styles.menuItem}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setTheme(isDark ? 'light' : 'dark');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setTheme(isDark ? 'light' : 'dark');
        }
      }}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
    >
      {isDark ? (
        <Moon size={15} weight="regular" className={styles.menuItemIcon} />
      ) : (
        <Sun size={15} weight="regular" className={styles.menuItemIcon} />
      )}
      <div className={styles.menuItemContent}>
        <span className={styles.menuItemTitle}>Appearance</span>
      </div>
    </div>
  );
}
