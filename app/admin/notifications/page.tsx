'use client'

import { useEffect, useState } from 'react'
import { FileText, MessageSquare, Search, Megaphone, Inbox, ListFilter, Building2, User } from 'lucide-react'
import Loading from '@/components/Loading'
import { useBuilding } from '@/components/BuildingContext'

interface Notification {
  id: string
  type: 'invoice' | 'announcement' | 'message'
  content: string
  buildingId: number
  buildingName: string
  roomName: string
  createdAt: Date | string
}

type FilterType = 'all' | 'invoice' | 'announcement' | 'message'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { selectedBuildingId } = useBuilding()

  useEffect(() => {
    fetchNotifications()
  }, [selectedBuildingId])

  const fetchNotifications = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return

      const user = JSON.parse(userData)
      const params = new URLSearchParams()
      params.append('userId', user.id)
      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

      const response = await fetch(`/api/admin/notifications?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeConfig = (type: 'invoice' | 'announcement' | 'message') => {
    const configs = {
      invoice: {
        icon: FileText,
        label: 'Hóa đơn',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        dotColor: 'bg-emerald-500',
        accentBorder: 'border-l-emerald-500',
      },
      announcement: {
        icon: Megaphone,
        label: 'Thông báo',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        dotColor: 'bg-blue-500',
        accentBorder: 'border-l-blue-500',
      },
      message: {
        icon: MessageSquare,
        label: 'Tin nhắn',
        iconBg: 'bg-violet-100 dark:bg-violet-900/30',
        iconColor: 'text-violet-600 dark:text-violet-400',
        dotColor: 'bg-violet-500',
        accentBorder: 'border-l-violet-500',
      },
    }
    return configs[type]
  }

  const formatRelativeTime = (date: Date | string) => {
    const current = new Date()
    const target = new Date(date)
    const diff = current.getTime() - target.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days === 1) return 'Hôm qua'
    if (days < 7) return `${days} ngày trước`
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(target)
  }

  const formatDateTime = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter = activeFilter === 'all' || n.type === activeFilter
    const matchesSearch =
      !searchQuery || n.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const invoiceCount = notifications.filter((n) => n.type === 'invoice').length
  const announcementCount = notifications.filter((n) => n.type === 'announcement').length
  const messageCount = notifications.filter((n) => n.type === 'message').length

  const filters: { key: FilterType; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tất cả', count: notifications.length, icon: <ListFilter size={14} /> },
    { key: 'invoice', label: 'Hóa đơn', count: invoiceCount, icon: <FileText size={14} /> },
    { key: 'announcement', label: 'Thông báo', count: announcementCount, icon: <Megaphone size={14} /> },
    { key: 'message', label: 'Tin nhắn', count: messageCount, icon: <MessageSquare size={14} /> },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight">THÔNG BÁO</h1>
        <p className="text-secondary mt-1 text-sm font-medium">Theo dõi thông báo hệ thống, hóa đơn và tin nhắn.</p>
      </div>

      {/* Filter Tabs + Search */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 flex-shrink-0 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeFilter === filter.key
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20'
                    : 'bg-tertiary text-secondary hover:text-primary hover:bg-quaternary border border-primary'
                }`}
              >
                {filter.icon}
                <span>{filter.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeFilter === filter.key
                      ? 'bg-white/20 text-white'
                      : 'bg-quaternary text-tertiary shadow-inner'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 lg:max-w-[400px] lg:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung thông báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon w-full pl-9 pr-4 py-2.5 text-sm bg-tertiary border-primary rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="card p-12">
          <Loading size="lg" text="Đang tải thông báo..." />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card p-16 text-center shadow-inner">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-tertiary mb-6 rotate-3 transform transition-transform hover:rotate-0 duration-500 border border-primary">
            <Inbox size={40} className="text-tertiary" />
          </div>
          <h3 className="text-xl font-black text-primary">Không có thông báo nào</h3>
          <p className="mt-2 text-sm text-secondary font-medium">
            {activeFilter !== 'all' || searchQuery
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm thông tin khác.'
              : 'Hiện tại hệ thống chưa có thông báo mới nào cho mục này.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const type = notification.type
            const config = getTypeConfig(type)
            const IconComponent = config.icon

            return (
              <div
                key={notification.id}
                className={`card p-4 sm:p-5 border-l-[4px] ${config.accentBorder} hover:shadow-xl transition-all duration-300 group cursor-default relative overflow-hidden`}
              >
                {/* Background Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${config.iconBg}`} />
                
                <div className="flex items-start gap-4 sm:gap-5 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 shadow-sm transition-all duration-500`}
                  >
                    <IconComponent size={22} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-black text-primary leading-tight mb-2">
                      {notification.content}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-primary/50">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${config.iconBg} ${config.iconColor} shadow-sm`}
                      >
                        <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
                        {config.label}
                      </span>
                      
                      {notification.buildingName && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <Building2 size={12} className="text-slate-400" />
                          <span className="truncate max-w-[120px]">{notification.buildingName}</span>
                          {notification.roomName && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-blue-500">{notification.roomName}</span>
                            </>
                          )}
                        </span>
                      )}
                      
                      <span className="text-[11px] font-medium text-tertiary ml-auto flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity" title={formatDateTime(notification.createdAt)}>
                        <span className="w-1 h-1 rounded-full bg-tertiary" />
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
