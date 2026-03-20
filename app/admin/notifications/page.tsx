'use client'

import { useEffect, useState } from 'react'
import { FileText, MessageSquare, Search, Megaphone, Inbox, ListFilter } from 'lucide-react'
import Loading from '@/components/Loading'

interface Notification {
  id: number
  content: string
  createdAt: Date | string
}

type FilterType = 'all' | 'invoice' | 'announcement' | 'message'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return

      const user = JSON.parse(userData)
      const response = await fetch(`/api/admin/notifications?userId=${user.id}`)
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

  const getNotificationType = (content: string): 'invoice' | 'announcement' | 'message' => {
    if (content.includes('[Hóa đơn')) return 'invoice'
    if (content.includes('[Tin nhắn')) return 'message'
    return 'announcement'
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
    const type = getNotificationType(n.content)
    const matchesFilter = activeFilter === 'all' || type === activeFilter
    const matchesSearch =
      !searchQuery || n.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const invoiceCount = notifications.filter((n) => getNotificationType(n.content) === 'invoice').length
  const announcementCount = notifications.filter((n) => getNotificationType(n.content) === 'announcement').length
  const messageCount = notifications.filter((n) => getNotificationType(n.content) === 'message').length

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
        <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase">THÔNG BÁO</h1>
        <p className="text-secondary mt-1 text-sm sm:text-base">Theo dõi thông báo hệ thống, hóa đơn và tin nhắn.</p>
      </div>

      {/* Filter Tabs + Search */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeFilter === filter.key
                    ? 'bg-[var(--accent-blue)] text-white shadow-md shadow-blue-500/20'
                    : 'bg-tertiary text-secondary hover:text-primary hover:bg-quaternary'
                }`}
              >
                {filter.icon}
                <span>{filter.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeFilter === filter.key
                      ? 'bg-white/20 text-white'
                      : 'bg-quaternary text-tertiary'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-[280px] sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon w-full pl-9 pr-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="card">
          <Loading size="lg" text="Đang tải thông báo..." />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary mb-4">
            <Inbox size={32} className="text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-primary">Không có thông báo</h3>
          <p className="mt-2 text-sm text-secondary">
            {activeFilter !== 'all' || searchQuery
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
              : 'Chưa có thông báo nào từ hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notification) => {
            const type = getNotificationType(notification.content)
            const config = getTypeConfig(type)
            const IconComponent = config.icon

            return (
              <div
                key={notification.id}
                className={`card p-4 sm:p-5 border-l-[3px] ${config.accentBorder} hover:shadow-lg transition-all duration-300 group cursor-default`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent size={18} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary leading-relaxed line-clamp-2">
                      {notification.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.iconBg} ${config.iconColor}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                        {config.label}
                      </span>
                      <span className="text-xs text-tertiary" title={formatDateTime(notification.createdAt)}>
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
