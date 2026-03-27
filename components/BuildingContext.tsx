'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Building {
  id: number
  name: string
  address: string
  floorCount: number
  totalRooms?: number
  rentedRooms?: number
  availableRooms?: number
  thumbnailUrl?: string | null
}

interface BuildingContextType {
  selectedBuildingId: number | null
  setSelectedBuildingId: (id: number | null) => void
  buildings: Building[]
  loading: boolean
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined)

export function BuildingProvider({ children }: { children: ReactNode }) {
  const [selectedBuildingId, setSelectedBuildingIdState] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedBuildingId')
      return saved ? parseInt(saved) : null
    }
    return null
  })
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Load from localStorage on mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await fetch('/api/admin/buildings?limit=100')
        const data = await res.json()
        if (data.buildings) {
          setBuildings(data.buildings)

          const savedId = localStorage.getItem('selectedBuildingId')
          if (savedId) {
            const id = parseInt(savedId)
            if (data.buildings.some((b: Building) => b.id === id)) {
              setSelectedBuildingIdState(id)
            } else {
              localStorage.removeItem('selectedBuildingId')
              setSelectedBuildingIdState(null)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch buildings for context:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBuildings()
  }, [])

  const setSelectedBuildingId = (id: number | null) => {
    setSelectedBuildingIdState(id)
    if (id) {
      localStorage.setItem('selectedBuildingId', id.toString())
    } else {
      localStorage.removeItem('selectedBuildingId')
    }
  }

  return (
    <BuildingContext.Provider value={{ selectedBuildingId, setSelectedBuildingId, buildings, loading }}>
      {children}
    </BuildingContext.Provider>
  )
}

export function useBuilding() {
  const context = useContext(BuildingContext)
  if (context === undefined) {
    throw new Error('useBuilding must be used within a BuildingProvider')
  }
  return context
}
