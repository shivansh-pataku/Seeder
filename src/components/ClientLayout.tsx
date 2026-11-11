'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { LoadingProvider } from './LoadingContext';
import { InkWellProvider } from './InkWell';
import Navbar from './Navbar';
import type { Session } from 'next-auth';

export interface ClientLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function ClientLayout({ children, session }: ClientLayoutProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
        <InkWellProvider>
          <LoadingProvider>
            <Navbar />
            {children}
          </LoadingProvider>
        </InkWellProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
