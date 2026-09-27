// src/app/Components/ClientLayout.js
'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './ThemeProvider'
import { LoadingProvider } from './LoadingContext'
import Navbar from "./Navbar"

export default function ClientLayout({ children, session }) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <ThemeProvider>
        <LoadingProvider>
          <Navbar />
          {children}
        </LoadingProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}