import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('cm_theme') === 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('cm_theme', 'dark')
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#11140F')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('cm_theme', 'light')
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F2EFE8')
    }
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
