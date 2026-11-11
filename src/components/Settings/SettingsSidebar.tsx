'use client';

import React from 'react';
import styles from '@/app/Styles/settings.module.css';
import { User, Gear } from '@phosphor-icons/react';

export interface SettingsSidebarProps {
  activeTab: 'profile' | 'account';
  onTabChange: (tab: 'profile' | 'account') => void;
}

export default function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <aside className={styles.settingsSidebar}>
      <button
        type="button"
        onClick={() => onTabChange('profile')}
        className={`${styles.sidebarTab} ${activeTab === 'profile' ? styles.sidebarTabActive : ''}`}
      >
        <User size={18} weight={activeTab === 'profile' ? 'fill' : 'regular'} />
        <span>Profile</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('account')}
        className={`${styles.sidebarTab} ${activeTab === 'account' ? styles.sidebarTabActive : ''}`}
      >
        <Gear size={18} weight={activeTab === 'account' ? 'fill' : 'regular'} />
        <span>Account</span>
      </button>
    </aside>
  );
}

