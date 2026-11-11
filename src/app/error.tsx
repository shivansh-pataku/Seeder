'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service or console
    console.error('Next.js Page ErrorBoundary caught:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          border: '1px solid var(--min-borders, #e5e7eb)',
          borderRadius: '8px',
          padding: '2.5rem 2rem',
          backgroundColor: 'var(--card-bg, #ffffff)',
          color: 'var(--foreground, #111111)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: '#dc2626',
            marginBottom: '0.75rem',
          }}
        >
          Application Error
        </span>

        <h2
          style={{
            fontSize: '1.6rem',
            fontWeight: 600,
            margin: '0 0 0.85rem 0',
            lineHeight: 1.25,
          }}
        >
          Something went wrong
        </h2>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#666666',
            lineHeight: 1.5,
            margin: '0 0 1.75rem 0',
          }}
        >
          An unexpected error occurred while rendering this section. You can try refreshing the
          component or navigate back to the home feed.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              padding: '0.65rem 1.4rem',
              backgroundColor: 'var(--foreground, #111111)',
              color: 'var(--background, #ffffff)',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
          >
            Try Again
          </button>

          <Link
            href="/"
            style={{
              padding: '0.65rem 1.4rem',
              backgroundColor: 'transparent',
              color: 'var(--foreground, #111111)',
              border: '1px solid var(--min-borders, #cccccc)',
              borderRadius: '4px',
              fontWeight: 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Return Home
          </Link>
        </div>

        {error?.digest && (
          <p
            style={{
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: '#999999',
              fontFamily: 'monospace',
            }}
          >
            Error digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
