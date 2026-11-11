import React from 'react';
import styles from '@/app/Styles/home.module.css';

export default function FeedSkeleton() {
  return (
    <div className={styles.feedGrid}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className={styles.feedCard} style={{ opacity: 0.5 }}>
          {/* Title & snippet skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                height: '22px',
                background: 'var(--min-borders)',
                width: '75%',
                marginBottom: '0.55rem',
              }}
            />
            <div
              style={{
                height: '14px',
                background: 'var(--min-borders)',
                width: '100%',
                marginBottom: '0.4rem',
              }}
            />
            <div
              style={{
                height: '14px',
                background: 'var(--min-borders)',
                width: '88%',
                marginBottom: '0.4rem',
              }}
            />
            <div style={{ height: '14px', background: 'var(--min-borders)', width: '65%' }} />
          </div>

          {/* Divider skeleton */}
          <div className={styles.feedCardDivider} />

          {/* Bottom author row skeleton */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '0px',
                  background: 'var(--min-borders)',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ width: '75px', height: '10px', background: 'var(--min-borders)' }} />
                <div style={{ width: '40px', height: '8px', background: 'var(--min-borders)' }} />
              </div>
            </div>
            <div style={{ width: '60px', height: '10px', background: 'var(--min-borders)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

