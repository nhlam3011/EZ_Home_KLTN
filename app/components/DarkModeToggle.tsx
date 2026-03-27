'use client'

import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../contexts/DarkModeContext'
import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const { isDark, toggleDarkMode } = useDarkMode()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-8 h-8" />

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        relative w-8 h-8 rounded-lg flex items-center justify-center
        transition-all duration-300 active:scale-90
        ${isDark ? 'bg-slate-800' : 'bg-slate-100'}
        border border-transparent hover:border-slate-300 dark:hover:border-slate-600
      `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {/* Sun Icon (Flat) */}
        <div 
          className={`
            absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${isDark 
              ? 'opacity-0 rotate-[120deg] scale-0' 
              : 'opacity-100 rotate-0 scale-100 text-amber-500'
            }
          `}
        >
          <Sun size={16} strokeWidth={2.5} />
        </div>
        
        {/* Moon Icon (Flat) */}
        <div 
          className={`
            absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${isDark 
              ? 'opacity-100 rotate-0 scale-100 text-indigo-400' 
              : 'opacity-0 rotate-[-120deg] scale-0'
            }
          `}
        >
          <Moon size={16} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  )
}
