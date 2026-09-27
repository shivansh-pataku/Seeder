import React from 'react';
import Link from 'next/link';
import styles from '../Styles/logsig.module.css';

export default function AuthBrandPanel({
  tagline = 'A workspace designed for writing, thinking, and reasoning.',
  subtext = 'Draft distraction-free stories, collaborate with AI, and publish directly to your audience.',
}) {
  return (
    <div className={styles.brandSide}>
      {/* Ambient gradient glow spheres */}
      <div className={styles.brandGlow} />
      <div className={styles.brandGlowSecondary} />

      {/* SVG Geometric Architectural Line Art (inspired by modern sci-fi / xAI geometric lines) */}
      <svg
        className={styles.brandGraphic}
        viewBox="0 0 700 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="lineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#d4a017" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="polyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Facet Polygons */}
        <polygon
          points="200,-50 550,280 420,850 120,400"
          fill="url(#polyGrad)"
          stroke="url(#lineGrad1)"
          strokeWidth="1.2"
        />
        <polygon
          points="420,850 680,600 550,280"
          fill="url(#polyGrad)"
          stroke="url(#lineGrad2)"
          strokeWidth="1"
        />

        {/* Dynamic Architectural Ray Lines */}
        <line x1="80" y1="-80" x2="620" y2="920" stroke="url(#lineGrad1)" strokeWidth="1.5" />
        <line x1="280" y1="-50" x2="690" y2="700" stroke="url(#lineGrad2)" strokeWidth="1" opacity="0.7" />
        <line x1="-50" y1="300" x2="650" y2="350" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="6 8" opacity="0.25" />
        <line x1="180" y1="150" x2="500" y2="850" stroke="url(#lineGrad1)" strokeWidth="1.2" opacity="0.5" />
        <line x1="380" y1="0" x2="150" y2="950" stroke="url(#lineGrad2)" strokeWidth="0.8" opacity="0.3" />

        {/* Floating subtle grid intersections */}
        <circle cx="550" cy="280" r="3" fill="#d4a017" opacity="0.8" />
        <circle cx="420" cy="850" r="2.5" fill="#ffffff" opacity="0.6" />
        <circle cx="120" cy="400" r="2" fill="#ffffff" opacity="0.5" />
      </svg>

      {/* Top Brand Header */}
      <div className={styles.brandHeader}>
        <Link href="/" className={styles.brandLogoMark}>
          <span>✦</span>
          <span>Project</span>
        </Link>
      </div>

      {/* Bottom Brand Identity */}
      <div className={styles.brandFooter}>
        <h2 className={styles.brandTagline}>{tagline}</h2>
        <p className={styles.brandSubtext}>{subtext}</p>
      </div>
    </div>
  );
}
