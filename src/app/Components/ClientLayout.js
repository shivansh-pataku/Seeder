// src/app/Components/ClientLayout.js
'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './ThemeProvider'
import Navbar from "./Navbar"

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider 
        refetchInterval={0} 
        refetchOnWindowFocus={false}
      >
        <Navbar />
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}