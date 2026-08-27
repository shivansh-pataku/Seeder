'use client'

import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  PencilEdit01Icon,
  SparklesIcon,
  Clock01Icon
} from '@hugeicons/core-free-icons';

export default function HomePage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/tasks');
  };

  return (
    <div className="Page-Home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <h2 className="hero-title">Your thoughts, structured by AI.</h2>
        <p className="hero-subtitle">
          The thoughts must be striked down properly to for a change.
        </p>
        <button className="hero-cta-btn" onClick={handleContinue}>
          <span>Open Workspace</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>
      </section>
    </div>
  );
}