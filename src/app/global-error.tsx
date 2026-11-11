'use client';

import React, { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Next.js Global Root Error caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '2rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
          backgroundColor: '#fafafa',
          color: '#111111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
            System Error
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 2rem 0' }}>
            A critical error occurred while loading the application shell.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
