// src/app/Components/ThemeProvider.js
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const initialTheme = stored || 'dark'; // Default to dark
    setTheme(initialTheme);
    // ✅ Change from body.className to data-theme attribute
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    // ✅ Change from body.className to data-theme attribute
    document.documentElement.setAttribute('data-theme', next);
  };

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