'use client'
import { useUser } from '../lib/UserProvider';
import styles from '../Styles/profile.module.css';

export default function ProfilePage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className={styles.profileContainer}>
        <h2 className={styles.profileTitle}>Profile</h2>
        <p className={styles.profileInfo}>You are not logged in.</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.profileTitle}>Profile</h2>
      <div className={styles.profileCard}>
        <div className={styles.profileRow}>
          <span className={styles.profileLabel}>Username:</span>
          <span className={styles.profileValue}>{user.username}</span>
        </div>
        <div className={styles.profileRow}>
          <span className={styles.profileLabel}>Email:</span>
          <span className={styles.profileValue}>{user.email}</span>
        </div>
        {/* Add more fields as needed */}
      </div>
    </div>
  );
}