// src/app/Components/ClientLayout.js
'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './ThemeProvider'
import Navbar from "./Navbar"

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider 
        refetchInterval={0} // Disable automatic refetch in simple terms means no polling
        // This will prevent the session from being refreshed when the window is focused. Focused means the user has clicked back into the browser tab. 
        // If you want to enable refetching when the window is focused, you can set this to true or a number of seconds.
        // In a real application, you might want to set this to a reasonable value like 5 * 60 (5 minutes) to keep the session fresh.
        refetchOnWindowFocus={false}
      >
        <Navbar />
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}