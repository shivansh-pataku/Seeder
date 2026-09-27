'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from '@phosphor-icons/react';
import styles from '../Styles/Navbar.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        toggleTheme();
      }}
      className={styles.menuLink}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      role="button"
      tabIndex={0}
    >
      {isDark ? (
        <Sun size={14} weight="regular" className={styles.dropdownIcon} />
      ) : (
        <Moon size={14} weight="regular" className={styles.dropdownIcon} />
      )}
      <span>Theme: {isDark ? 'Dark' : 'Light'}</span>
    </div>
  );
}
