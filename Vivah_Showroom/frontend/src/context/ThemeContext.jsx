// ============================================================================
// ThemeContext.jsx — light/dark mode, shared across the whole app.
//
// "Context" is React's way of sharing a value with any component, anywhere
// in the tree, without manually passing it down as a prop through every
// parent. Here, ANY component can call useTheme() (defined below) to read
// the current theme or flip it — see Navbar.jsx's dark-mode toggle button
// for the main consumer.
//
// HOW THE ACTUAL DARK MODE WORKS:
//   Tailwind (see index.css) is configured so that any class written as
//   "dark:bg-noir" only applies when the <html> tag has the CSS class
//   "dark" on it. This file's job is simply to add/remove that "dark"
//   class on <html> (document.documentElement) whenever the theme changes,
//   and to remember the choice in localStorage so it persists on refresh.
//
// CONNECTS TO:
//   - main.jsx        -> wraps the whole app in <ThemeProvider>
//   - Navbar.jsx       -> renders the sun/moon toggle button using useTheme()
// ============================================================================
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // Lazy initializer: on first load, check localStorage for a saved
  // preference; if there isn't one, fall back to the visitor's OS-level
  // dark/light preference (prefers-color-scheme media query).
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light' // safety check (no window during server-side builds)
    return localStorage.getItem('vivah-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })

  // Runs every time `theme` changes: toggles the "dark" class on <html>
  // (which is what makes all the dark:* Tailwind classes take effect)
  // and saves the choice so it's remembered next visit.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('vivah-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  // Anything wrapped in <ThemeProvider> can now call useTheme() to get
  // { theme, toggleTheme } — see below.
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

// Custom hook — the standard way to *read* a context's value.
// Usage anywhere in the app: const { theme, toggleTheme } = useTheme()
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
