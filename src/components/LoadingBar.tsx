'use client';

import React from 'react';
import { useLoading } from './LoadingContext';

export interface LoadingBarProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function LoadingBar({ className, style }: LoadingBarProps) {
  const { progress, visible, isFading } = useLoading();

  if (!visible && progress === 0) {
    return null;
  }

  let transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease';
  if (progress === 100) {
    transition = 'transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.25s ease';
  } else if (progress === 0 && !visible) {
    transition = 'none';
  }

  const barStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '1.5px',
    backgroundColor: 'var(--editor-accent, #6366f1)',
    transformOrigin: 'left',
    transform: `scaleX(${progress / 100})`,
    opacity: visible ? (isFading ? 0 : 1) : 0,
    transition,
    pointerEvents: 'none',
    zIndex: 9999,
    willChange: 'transform, opacity',
    ...style,
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className={className}
      style={barStyle}
    />
  );
}
