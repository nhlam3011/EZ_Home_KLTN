'use client'

import { Building2, MapPin, ArrowRight, Layers, Search, LayoutDashboard, DoorOpen, ChevronRight } from 'lucide-react'
import { useBuilding } from '@/components/BuildingContext'
import { useState } from 'react'
import Link from 'next/link'


interface BuildingSelectorProps {
  onSelect?: (id: number) => void
}

export default function BuildingSelector({ onSelect }: BuildingSelectorProps) {
  const { buildings, setSelectedBuildingId, loading } = useBuilding()
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const filteredBuildings = buildings.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (id: number) => {
    setSelectedBuildingId(id)
    onSelect?.(id)
  }

  if (loading) {
    return (
      <div className="w-full animate-in fade-in duration-500">
        {/* Header Skeleton to prevent layout shift */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="h-8 w-56 sm:w-72 bg-slate-200 dark:bg-slate-800/80 rounded-xl mb-2.5 animate-pulse"></div>
            <div className="h-4 w-48 sm:w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-full md:w-80 h-11 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {/* Skeleton for "TỔNG QUAN" card */}
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-800/80 p-6 flex flex-col h-[340px] animate-pulse border border-slate-200 dark:border-slate-700 shadow-sm relative">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-white/40 dark:bg-white/10"></div>
              <div className="w-24 h-6 rounded-full bg-white/40 dark:bg-white/10"></div>
            </div>
            <div className="mt-auto space-y-4">
              <div className="h-6 w-3/4 bg-white/40 dark:bg-white/10 rounded-lg"></div>
              <div className="h-3 w-1/2 bg-white/40 dark:bg-white/10 rounded-md mb-4"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/30 dark:bg-white/5 rounded-xl p-3 h-16"></div>
                <div className="bg-white/30 dark:bg-white/5 rounded-xl p-3 h-16"></div>
              </div>
            </div>
          </div>

          {/* Skeletons for regular building cards */}
          {[...Array(9)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-primary border border-primary shadow-sm flex flex-col h-[340px] relative">
              <div className="h-40 bg-slate-200 dark:bg-slate-800 animate-pulse w-full"></div>
              
              <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-md animate-pulse"></div>
              
              <div className="p-5 flex-1 flex flex-col bg-primary">
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-3"></div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded-md animate-pulse mb-6"></div>
                
                <div className="grid grid-cols-3 gap-3 mt-auto mb-5">
                  <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
                  <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
                  <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
                </div>

                <div className="pt-4 border-t border-primary flex items-center justify-between">
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Tổng số liệu toàn hệ thống
  const totalSystemRooms = buildings.reduce((acc, b) => acc + (b.totalRooms || 0), 0)
  const totalSystemRented = buildings.reduce((acc, b) => acc + (b.rentedRooms || 0), 0)
  const systemOccupancyRate = totalSystemRooms > 0 ? Math.round((totalSystemRented / totalSystemRooms) * 100) : 0

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase text-primary mb-1">
            Chọn không gian quản lý
          </h1>
          <p className="text-secondary text-sm">
            Quản lý tập trung hoặc chọn một toà nhà cụ thể.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên hoặc địa chỉ toà nhà..."
            className="input input-with-icon w-full h-11 pr-4 rounded-xl bg-white dark:bg-primary border-primary focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm font-medium placeholder:text-tertiary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {/* Card: Tổng quan hệ thống (All Buildings) */}
        {!search && (
          <Link
            href="/admin?viewAll=1"
            className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer focus:outline-none"
            style={{ animation: 'fadeInUp 0.6s ease-out both' }}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent"></div>

            <div className="relative h-full p-6 flex flex-col">
              <div className="flex justify-between items-start mb-auto">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <LayoutDashboard className="text-white" size={24} />
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                  <span className="text-xs font-bold text-white tracking-wide">TỔNG QUAN</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white drop-shadow-sm">Toàn hệ thống</h3>
                  <p className="text-blue-100 text-xs mt-1 mb-4 opacity-90">Báo cáo tổng hợp tất cả cơ sở</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <p className="text-xl font-bold text-white">{buildings.length}</p>
                    <p className="text-[10px] text-blue-100 font-semibold uppercase mt-0.5">Toà nhà</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <p className="text-xl font-bold text-white">{totalSystemRooms}</p>
                    <p className="text-[10px] text-blue-100 font-semibold uppercase mt-0.5">Tổng phòng</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-1.5 w-full max-w-[80px] bg-black/20 rounded-full overflow-hidden flex-shrink-0">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${systemOccupancyRate}%` }}></div>
                    </div>
                    <span className="text-[10px] text-green-300 font-bold whitespace-nowrap">{systemOccupancyRate}% lấp đầy</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:bg-white group-hover:text-blue-600 text-white flex-shrink-0">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}


        {/* Regular Building Cards */}
        {filteredBuildings.map((building: any, index: number) => {
          const occupancyRate = building.totalRooms > 0
            ? Math.round((building.rentedRooms / building.totalRooms) * 100)
            : 0

          return (
            <button
              key={building.id}
              onClick={() => handleSelect(building.id)}
              className="group relative text-left rounded-xl overflow-hidden bg-primary border border-primary transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-500/30 cursor-pointer focus:outline-none flex flex-col"
              style={{
                animationDelay: `${(index + (!search ? 2 : 0)) * 80}ms`,
                animation: 'fadeInUp 0.6s ease-out both'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 opacity-60"></div>

              {/* Thumbnail Header */}
              <div className="relative h-40 w-full overflow-hidden flex-shrink-0">
                {building.thumbnailUrl ? (
                  <img
                    src={building.thumbnailUrl}
                    alt={building.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${index % 3 === 0 ? 'from-indigo-400 to-blue-500' :
                    index % 3 === 1 ? 'from-emerald-400 to-teal-500' :
                      'from-orange-400 to-rose-500'
                    } transition-transform duration-500 ease-in-out group-hover:scale-105`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                  <Building2 size={16} className="text-white drop-shadow-sm" />
                </div>

                {building.totalRooms > 0 && (
                  <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-lg whitespace-nowrap transition-transform duration-300 group-hover:scale-105">
                    <span className="text-xs font-bold text-white tracking-wide">{occupancyRate}% <span className="opacity-80 font-medium">lấp đầy</span></span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col bg-primary relative z-20">
                <h3 className="text-lg font-bold text-primary mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">{building.name}</h3>
                <div className="flex items-start gap-2 mb-5">
                  <MapPin size={14} className="text-tertiary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-secondary line-clamp-2 leading-relaxed">{building.address}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-auto">
                  <div className="text-center p-2.5 rounded-xl bg-tertiary">
                    <p className="text-base font-bold text-primary">{building.totalRooms || 0}</p>
                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider mt-1">Phòng</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                    <p className="text-base font-bold text-blue-600 dark:text-blue-400">{building.rentedRooms || 0}</p>
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider mt-1 opacity-90">Đã thuê</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-green-50 dark:bg-green-500/10">
                    <p className="text-base font-bold text-green-600 dark:text-green-400">{building.availableRooms || 0}</p>
                    <p className="text-[10px] text-green-500 dark:text-green-400 font-bold uppercase tracking-wider mt-1 opacity-90">Trống</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-primary flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tertiary transition-colors group-hover:bg-primary border border-transparent group-hover:border-tertiary">
                    <Layers size={14} className="text-tertiary" />
                    <span className="text-xs text-secondary font-bold">{building.floorCount} TẦNG</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <span className="text-xs font-bold uppercase tracking-wide">Quản lý</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredBuildings.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm mt-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-5 border border-gray-100 dark:border-gray-700">
            <Building2 size={32} className="text-tertiary opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-primary mb-1">Không tìm thấy kết quả</h3>
          <p className="text-secondary font-medium">
            {search ? `Không có toà nhà nào phù hợp với từ khóa "${search}"` : 'Chưa có toà nhà nào trong hệ thống'}
          </p>
        </div>
      )}
    </div>
  )
}
