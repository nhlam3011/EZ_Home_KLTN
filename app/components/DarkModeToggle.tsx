'use client'

import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../contexts/DarkModeContext'
import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const { isDark, toggleDarkMode } = useDarkMode()
  const [mounted, setMounted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    setIsTransitioning(true)
    toggleDarkMode()
    setTimeout(() => setIsTransitioning(false), 500)
  }

  if (!mounted) return <div className="w-8 h-8 rounded-full bg-slate-200/50 animate-pulse" />

  return (
    <button
      onClick={handleToggle}
      className={`
        relative w-8.5 h-8.5 rounded-xl flex items-center justify-center
        transition-all duration-300 active:scale-90 group
        ${isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-slate-100/50 border-slate-200 shadow-sm'}
        border backdrop-blur-sm overflow-hidden
      `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Internal Diffusion Glow */}
      <div 
        className={`
          absolute inset-0 transition-all duration-700
          ${isDark 
            ? 'bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent' 
            : 'bg-gradient-to-tr from-amber-400/10 via-orange-300/5 to-transparent'
          }
        `} 
      />

      {/* Morphing Icons */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {/* Sun Icon */}
        <div 
          className={`
            absolute transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${isDark 
              ? 'opacity-0 scale-50 rotate-90 translate-y-4' 
              : 'opacity-100 scale-100 rotate-0 translate-y-0 text-amber-500'
            }
          `}
        >
          <Sun size={18} strokeWidth={2} />
        </div>
        
        {/* Moon Icon */}
        <div 
          className={`
            absolute transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${isDark 
              ? 'opacity-100 scale-100 rotate-0 translate-y-0 text-indigo-400' 
              : 'opacity-0 scale-50 -rotate-90 -translate-y-4'
            }
          `}
        >
          <Moon size={18} strokeWidth={2} fill={isDark ? "currentColor" : "none"} className="fill-indigo-400/10" />
        </div>
      </div>

      {/* Scanning Refraction (Glass effect) */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
          transition-all duration-1000 -translate-x-full
          group-hover:translate-x-full
        `} 
      />

      {/* Click Burst Effect */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-white/10 dark:bg-white/5 animate-ping rounded-full" />
      )}
    </button>
  )
}
