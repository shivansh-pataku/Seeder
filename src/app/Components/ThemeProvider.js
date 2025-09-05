'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null); // Start as null

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const initialTheme = stored || 'light';
    setTheme(initialTheme);
    document.body.className = initialTheme;
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.body.className = next;
  };

  // Don't render children until theme is known
  if (!theme) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}