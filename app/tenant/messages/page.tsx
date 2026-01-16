'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Bell, Calendar, User } from 'lucide-react'

interface Message {
  id: number
  content: string
  createdAt: string
  user: {
    fullName: string
    avatarUrl: string | null
    role: string
  }
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/tenant/messages')
      const data = await response.json()
      setMessages(data.messages || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    const msgDate = new Date(date)
    const now = new Date()
    const diff = now.getTime() - msgDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 7) {
      return msgDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } else if (days > 0) {
      return `${days} ngày trước`
    } else if (hours > 0) {
      return `${hours} giờ trước`
    } else if (minutes > 0) {
      return `${minutes} phút trước`
    } else {
      return 'Vừa xong'
    }
  }

  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const extractMessageType = (content: string) => {
    if (content.startsWith('[Hóa đơn')) {
      return { type: 'Hóa đơn', color: 'bg-blue-100 text-blue-700' }
    } else if (content.startsWith('[Thông báo')) {
      return { type: 'Thông báo', color: 'bg-green-100 text-green-700' }
    } else if (content.startsWith('[Tin nhắn')) {
      return { type: 'Tin nhắn', color: 'bg-purple-100 text-purple-700' }
    }
    return { type: 'Tin nhắn', color: 'bg-gray-100 text-gray-700' }
  }

  const cleanContent = (content: string) => {
    // Remove prefix like [Hóa đơn #123] or [Thông báo]
    return content.replace(/^\[[^\]]+\]\s*/, '')
  }

  const isRecent = (date: string) => {
    const msgDate = new Date(date)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return msgDate >= sevenDaysAgo
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải tin nhắn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/tenant"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tin nhắn</h1>
              <p className="text-gray-600 mt-1">Tin nhắn và thông báo từ quản lý</p>
            </div>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <Bell className="text-red-600" size={20} />
            <span className="text-sm font-semibold text-red-700">
              {unreadCount} tin chưa đọc
            </span>
          </div>
        )}
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có tin nhắn</h3>
          <p className="text-gray-500">Bạn chưa nhận được tin nhắn nào từ quản lý</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const messageType = extractMessageType(message.content)
            const isNew = isRecent(message.createdAt)
            
            return (
              <div
                key={message.id}
                className={`bg-white rounded-lg shadow-sm border ${
                  isNew ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'
                } p-6 hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.user.avatarUrl ? (
                      <img
                        src={message.user.avatarUrl}
                        alt={message.user.fullName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {message.user.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {message.user.fullName}
                          </h3>
                          {message.user.role === 'ADMIN' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Quản lý
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${messageType.color}`}>
                            {messageType.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                          {cleanContent(message.content)}
                        </p>
                      </div>
                      {isNew && (
                        <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} />
                      <span>{formatDate(message.createdAt)}</span>
                      <span>•</span>
                      <span>{formatFullDate(message.createdAt)}</span>
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
