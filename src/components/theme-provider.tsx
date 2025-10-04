'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark') // Default to dark

  useEffect(() => {
    // This effect runs once on the client after initial render.
    const storedTheme = localStorage.getItem('aether-alert-theme') as Theme | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = storedTheme || systemTheme;
    setThemeState(initialTheme);
  }, [])
  
  useEffect(() => {
    // This effect runs whenever the theme state changes.
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    try {
        localStorage.setItem('aether-alert-theme', theme)
    } catch (e) {
        // localStorage is not available
    }
  }, [theme])


  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
