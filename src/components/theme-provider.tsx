"use client"

import * as React from "react"
import { type ReactNode } from "react"

type Theme = "dark" | "light"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(
  undefined
)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark")

  React.useEffect(() => {
    const storedTheme = localStorage.getItem("aether-alert-theme") as Theme | null
    if (storedTheme) {
      setThemeState(storedTheme)
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      setThemeState(systemTheme)
    }
  }, [])

  React.useEffect(() => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("aether-alert-theme", newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
