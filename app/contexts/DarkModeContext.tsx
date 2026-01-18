'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface DarkModeContextType {
  isDark: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode')
    let initialDark = false
    
    if (saved !== null) {
      initialDark = saved === 'true'
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      initialDark = prefersDark
    }
    
    setIsDark(initialDark)
    
    // Apply initial state immediately - ensure class is set before mount
    const html = document.documentElement
    if (initialDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const html = document.documentElement
    
    if (isDark) {
      html.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }, [isDark, mounted])

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const newValue = !prev
      // Apply immediately for better UX
      const html = document.documentElement
      if (newValue) {
        html.classList.add('dark')
        localStorage.setItem('darkMode', 'true')
      } else {
        html.classList.remove('dark')
        localStorage.setItem('darkMode', 'false')
      }
      return newValue
    })
  }

  // Always return Provider to avoid context errors, even before mounted
  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}
