import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';

// Theme context so all components share ONE theme state
// Previously, every component calling useTheme() got its own useState,
// causing duplicate event handling and potential state divergence.
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nutrimeth-theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nutrimeth-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setThemeState(prev => prev === 'dark' ? 'light' : 'dark'), []);
  const setTheme = useCallback((t) => setThemeState(t), []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Fallback for components that use useTheme outside ThemeProvider (shouldn't happen, but safe)
  if (!ctx) {
    const [theme, setThemeState] = useState(() =>
      typeof window !== 'undefined' ? localStorage.getItem('nutrimeth-theme') || 'light' : 'light'
    );
    return { theme, setTheme: setThemeState, toggleTheme: () => setThemeState(p => p === 'dark' ? 'light' : 'dark') };
  }
  return ctx;
}
