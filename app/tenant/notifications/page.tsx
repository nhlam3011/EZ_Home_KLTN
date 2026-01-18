'use client'

import { useEffect, useState } from 'react'
import { Bell, FileText, X } from 'lucide-react'

interface Notification {
  id: number
  content: string
  createdAt: Date | string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/tenant/notifications')
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

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Thông báo</h1>
        <p className="text-secondary mt-1">Xem các thông báo từ quản lý</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-tertiary">Đang tải...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={48} className="text-tertiary mx-auto mb-4" />
          <p className="text-tertiary">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary mb-1">
                    {notification.content}
                  </p>
                  <p className="text-xs text-tertiary">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
