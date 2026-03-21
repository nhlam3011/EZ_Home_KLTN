'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Building {
  id: number
  name: string
  address: string
  floorCount: number
}

interface BuildingContextType {
  selectedBuildingId: number | null
  setSelectedBuildingId: (id: number | null) => void
  buildings: Building[]
  loading: boolean
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined)

export function BuildingProvider({ children }: { children: ReactNode }) {
  const [selectedBuildingId, setSelectedBuildingIdState] = useState<number | null>(null)
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
            // Check if saved ID still exists in the list
            if (data.buildings.some((b: Building) => b.id === id)) {
              setSelectedBuildingIdState(id)
            } else if (data.buildings.length > 0) {
              const firstId = data.buildings[0].id
              setSelectedBuildingIdState(firstId)
              localStorage.setItem('selectedBuildingId', firstId.toString())
            }
          } else if (data.buildings.length > 0) {
            const firstId = data.buildings[0].id
            setSelectedBuildingIdState(firstId)
            localStorage.setItem('selectedBuildingId', firstId.toString())
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
