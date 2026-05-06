import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import { tipcClient, rendererHandlers } from "@renderer/lib/tipc-client"
import {
  THEME_PREFERENCE_CHANGED_EVENT,
  isThemePreference,
  loadThemePreference,
  resolveThemePreference,
  saveThemePreference,
  type ThemePreferenceValue,
} from "@dotagents/shared/theme-preference"

export type ThemeMode = ThemePreferenceValue

interface ThemeContextType {
  theme: "light" | "dark"
  themeMode: ThemeMode
  isDark: boolean
  isLight: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => loadThemePreference())

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (themeMode === "light") return "light"
    if (themeMode === "dark") return "dark"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  const resolveTheme = (mode: ThemeMode): "light" | "dark" => {
    return resolveThemePreference(mode, window.matchMedia("(prefers-color-scheme: dark)").matches)
  }

  // Update theme when themeMode changes
  useEffect(() => {
    const newTheme = resolveTheme(themeMode)
    setTheme(newTheme)

    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    saveThemePreference(themeMode)

    window.dispatchEvent(
      new CustomEvent(THEME_PREFERENCE_CHANGED_EVENT, {
        detail: themeMode,
      })
    )

    // Broadcast to all windows via IPC so the panel window stays in sync
    tipcClient.broadcastThemeChange?.({ themeMode }).catch(() => {})
  }, [themeMode])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (themeMode !== "system") return undefined

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light"
      setTheme(newTheme)

      const root = document.documentElement
      if (newTheme === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [themeMode])

  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      const newMode = e.detail
      if (isThemePreference(newMode)) {
        setThemeModeState(newMode)
      }
    }

    window.addEventListener(THEME_PREFERENCE_CHANGED_EVENT, handleThemeChange as EventListener)
    return () => window.removeEventListener(THEME_PREFERENCE_CHANGED_EVENT, handleThemeChange as EventListener)
  }, [])

  // Listen for theme changes broadcast from other windows via IPC
  useEffect(() => {
    const unlisten = rendererHandlers.themeChanged.listen((newMode: string) => {
      if (isThemePreference(newMode) && newMode !== themeMode) {
        setThemeModeState(newMode)
      }
    })
    return unlisten
  }, [themeMode])

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isDarkClass = document.documentElement.classList.contains("dark")
          const expectedTheme = resolveTheme(themeMode)

          if ((isDarkClass && expectedTheme === "light") || (!isDarkClass && expectedTheme === "dark")) {
            setTheme(isDarkClass ? "dark" : "light")
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [themeMode])

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
  }

  const toggleTheme = () => {
    setThemeMode(theme === "dark" ? "light" : "dark")
  }

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    isDark: theme === "dark",
    isLight: theme === "light",
    setThemeMode,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function useThemeDetection() {
  const { isDark } = useTheme()
  return { isDark }
}
