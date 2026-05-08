'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface UserData {
  id: number
  phone: string
  fullName: string
  email: string | null
  role: string
  isFirstLogin: boolean
  avatarUrl?: string | null
  room?: {
    id: number
    name: string
    floor: number
    buildingId: number
  } | null
}

interface AuthContextType {
  user: UserData | null
  loading: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshSession: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include', // ensure cookies are sent
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user || null)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear any remaining localStorage/sessionStorage data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('token')
      }
      setUser(null)
      router.push('/login')
    }
  }, [router])

  const refreshSession = useCallback(async () => {
    setLoading(true)
    await fetchSession()
  }, [fetchSession])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
