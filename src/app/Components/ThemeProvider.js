'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const { data: session, status } = useSession();
  const [theme, setTheme] = useState('light');

  const isAuthenticated = status === 'authenticated' && !!session?.user;

  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      // Unauthenticated / logged-out visitors are ALWAYS white as white
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // Authenticated users restore their saved preference, defaulting to light
      const stored = localStorage.getItem('theme');
      const userTheme = stored === 'dark' ? 'dark' : 'light';
      setTheme(userTheme);
      document.documentElement.setAttribute('data-theme', userTheme);
    }
  }, [status, isAuthenticated]);

  const toggleTheme = () => {
    // Only logged in users are allowed to change theme
    if (!isAuthenticated) return;

    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}