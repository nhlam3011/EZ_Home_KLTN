'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { MessageSquare, Send, Search, User, ArrowLeft, Image as ImageIcon, X, Trash2, Building2, MoreVertical, Menu } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: number
  content: string
  images: string[]
  isRead: boolean
  createdAt: string
  sender: {
    id: number
    fullName: string
    avatarUrl: string | null
    role: string
  }
  receiver: {
    id: number
    fullName: string
    avatarUrl: string | null
    role: string
  }
}

interface Tenant {
  id: number
  fullName: string
  avatarUrl: string | null
  phone: string
  room: {
    id: number
    name: string
    floor: number
  } | null
}

export default function AdminMessagesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  // Lưu tin nhắn theo từng tenant ID
  const [messagesByTenant, setMessagesByTenant] = useState<Record<number, Message[]>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUserAndMessages = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
            setUser(parsedUser)
            fetchMessages(parsedUser.id)
          } else {
            console.error('Invalid user data')
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }

    loadUserAndMessages()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      })
    }
  }, [])

  // Handle visibility change - refetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const userData = localStorage.getItem('user')
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData)
            if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
              setUser(parsedUser)
              if (selectedTenant) {
                fetchMessagesWithTenant(selectedTenant.id, parsedUser.id)
              } else {
                fetchMessages(parsedUser.id)
              }
            }
          } catch (error) {
            console.error('Error parsing user data on visibility change:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedTenant])

  // Lấy tin nhắn của tenant hiện tại
  const messages = selectedTenant ? (messagesByTenant[selectedTenant.id] || []) : []

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedTenant])

  // Real-time connection with SSE
  useEffect(() => {
    if (!user || !selectedTenant) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setIsConnected(false)
      }
      return
    }

    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 10
    const RECONNECT_DELAY = 3000

    const connectSSE = () => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      // Create new SSE connection
      const eventSource = new EventSource(
        `/api/messages/stream?userId=${user.id}&otherUserId=${selectedTenant.id}&role=ADMIN`
      )

      eventSource.onopen = () => {
        setIsConnected(true)
        reconnectAttempts = 0 // Reset on successful connection
        console.log('SSE connection established')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            console.log('SSE connected:', data)
            setIsConnected(true)
          } else if (data.type === 'messages' && data.messages) {
            setMessagesByTenant(prev => {
              const updated = { ...prev }
              
              // Xử lý từng tin nhắn và lưu vào đúng tenant
              data.messages.forEach((m: Message) => {
                // Xác định tenant ID từ tin nhắn
                const tenantId = m.sender.role === 'TENANT' ? m.sender.id : m.receiver.id
                
                if (!updated[tenantId]) {
                  updated[tenantId] = []
                }
                
                // Chỉ thêm nếu chưa có
                const existingIds = new Set(updated[tenantId].map(msg => msg.id))
                if (!existingIds.has(m.id)) {
                  updated[tenantId] = [...updated[tenantId], m]
                  // Sắp xếp theo thời gian
                  updated[tenantId].sort((a, b) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                  )
                }
              })
              
              // Show push notification for new messages from tenant
              if (selectedTenant) {
                const tenantMessages = data.messages.filter((m: Message) => 
                  m.sender.role === 'TENANT' && 
                  (m.sender.id === selectedTenant.id || m.receiver.id === selectedTenant.id)
                )
                if (tenantMessages.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
                  // Only show notification if page is not focused
                  if (document.hidden || !document.hasFocus()) {
                    const latestMessage = tenantMessages[tenantMessages.length - 1]
                    const notificationText = latestMessage.content 
                      ? (latestMessage.content.length > 50 ? latestMessage.content.substring(0, 50) + '...' : latestMessage.content)
                      : 'Có hình ảnh đính kèm'
                    
                    new Notification(`Tin nhắn mới từ ${latestMessage.sender.fullName}`, {
                      body: notificationText,
                      icon: '/favicon.ico',
                      badge: '/favicon.ico',
                      tag: 'message-notification',
                      requireInteraction: false
                    })
                  }
                }
              }
              
              return updated
            })
            
            // Cập nhật unreadCount cho tất cả tenant khi có tin nhắn mới
            if (data.messages && data.messages.length > 0 && user) {
              fetchUnreadCounts(user.id)
            }
          } else if (data.type === 'heartbeat') {
            // Connection is alive
            setIsConnected(true)
          } else if (data.type === 'error') {
            console.error('SSE error:', data.error, data.code)
            
            // Handle different error types
            if (data.code === 'SESSION_EXPIRED' || data.code === 'AUTH_ERROR') {
              // Session expired - check if user is still logged in
              const userData = localStorage.getItem('user')
              if (!userData) {
                // User is logged out, don't reconnect
                eventSource.close()
                eventSourceRef.current = null
                setIsConnected(false)
                return
              }
              // User still logged in, try to reconnect
            }
            // For other errors, continue with normal reconnection logic
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        setIsConnected(false)
        console.error('SSE connection error:', error)
        
        // Only reconnect if we haven't exceeded max attempts
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++
          console.log(`Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
          
          // Clear any existing timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
          }
          
          // Reconnect after delay
          reconnectTimeout = setTimeout(() => {
            if (user && selectedTenant) {
              connectSSE()
            }
          }, RECONNECT_DELAY)
        } else {
          console.error('Max reconnection attempts reached')
          eventSource.close()
          eventSourceRef.current = null
        }
      }

      eventSourceRef.current = eventSource
    }

    // Initial connection
    connectSSE()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
    }
  }, [user, selectedTenant])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchMessages = async (userId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/messages?userId=${userId}`)
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Authentication error - check localStorage again
          const userData = localStorage.getItem('user')
          if (!userData) {
            console.error('User not found in localStorage')
            return
          }
          try {
            const parsedUser = JSON.parse(userData)
            if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
              // Retry once
              const retryResponse = await fetch(`/api/admin/messages?userId=${parsedUser.id}`)
              if (!retryResponse.ok) {
                const error = await retryResponse.json()
                console.error('Error fetching messages after retry:', error)
                return
              }
              const retryData = await retryResponse.json()
              setTenants(retryData.tenants || [])
              setUnreadCounts(retryData.unreadCounts || {})
              return
            }
          } catch (parseError) {
            console.error('Error parsing user data on retry:', parseError)
            return
          }
        }
        const error = await response.json()
        console.error('Error fetching messages:', error)
        return
      }
      const data = await response.json()
      
      setTenants(data.tenants || [])
      setUnreadCounts(data.unreadCounts || {})
      
      if (!selectedTenant) {
        if (data.tenantsWithMessages && data.tenantsWithMessages.length > 0) {
          setSelectedTenant(data.tenantsWithMessages[0])
        } else if (data.tenants && data.tenants.length > 0) {
          setSelectedTenant(data.tenants[0])
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessagesWithTenant = async (tenantId: number, userId: number) => {
    try {
      const response = await fetch(`/api/admin/messages/${tenantId}?userId=${userId}`)
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Authentication error - check localStorage again
          const userData = localStorage.getItem('user')
          if (!userData) {
            console.error('User not found in localStorage')
            return
          }
          try {
            const parsedUser = JSON.parse(userData)
            if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
              // Retry once
              const retryResponse = await fetch(`/api/admin/messages/${tenantId}?userId=${parsedUser.id}`)
              if (!retryResponse.ok) {
                const error = await retryResponse.json()
                console.error('Error fetching messages with tenant after retry:', error)
                return
              }
              const retryData = await retryResponse.json()
              if (retryData.tenant && retryData.tenant.room) {
                setSelectedTenant(prev => prev ? { ...prev, room: retryData.tenant.room } : null)
              }
              // Lưu tin nhắn vào cache theo tenant ID
              const messages: Message[] = retryData.messages || []
              const uniqueMessages: Message[] = Array.from(
                new Map(messages.map((m: Message) => [m.id, m])).values()
              ) as Message[]
              uniqueMessages.sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
              
              setMessagesByTenant(prev => ({
                ...prev,
                [tenantId]: uniqueMessages
              }))
              if (retryData.unreadCount !== undefined) {
                setUnreadCounts(prev => ({
                  ...prev,
                  [tenantId]: retryData.unreadCount
                }))
              }
              return
            }
          } catch (parseError) {
            console.error('Error parsing user data on retry:', parseError)
            return
          }
        }
        const error = await response.json()
        console.error('Error fetching messages with tenant:', error)
        return
      }
      const data = await response.json()
      
      if (data.tenant && data.tenant.room) {
        setSelectedTenant(prev => prev ? { ...prev, room: data.tenant.room } : null)
      }
      
      // Lưu tin nhắn vào cache theo tenant ID
      const messages: Message[] = data.messages || []
      const uniqueMessages: Message[] = Array.from(
        new Map(messages.map((m: Message) => [m.id, m])).values()
      ) as Message[]
      uniqueMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      setMessagesByTenant(prev => ({
        ...prev,
        [tenantId]: uniqueMessages
      }))
      
      if (data.unreadCount !== undefined) {
        setUnreadCounts(prev => ({
          ...prev,
          [tenantId]: data.unreadCount
        }))
      }
    } catch (error) {
      console.error('Error fetching messages with tenant:', error)
    }
  }

  const fetchUnreadCounts = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/messages?userId=${userId}`)
      const data = await response.json()
      setUnreadCounts(data.unreadCounts || {})
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  useEffect(() => {
    if (selectedTenant && user) {
      // Luôn tải tin nhắn để cập nhật unreadCount và đánh dấu đã đọc
      fetchMessagesWithTenant(selectedTenant.id, user.id)
    }
  }, [selectedTenant, user])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('File must be an image')
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5MB')
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/messages/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload image')
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setSelectedImages(prev => [...prev, ...uploadedUrls])
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi tải ảnh lên')
    } finally {
      setUploadingImages(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteHistory = async () => {
    if (!selectedTenant || !user) return
    
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với ' + selectedTenant.fullName + '?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/messages/${selectedTenant.id}?userId=${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Xóa tin nhắn của tenant này khỏi cache
        setMessagesByTenant(prev => {
          const updated = { ...prev }
          delete updated[selectedTenant.id]
          return updated
        })
        fetchMessages(user.id)
        alert('Đã xóa lịch sử trò chuyện')
      } else {
        const error = await response.json()
        alert(error.error || 'Không thể xóa lịch sử')
      }
    } catch (error) {
      console.error('Error deleting messages:', error)
      alert('Không thể xóa lịch sử')
    } finally {
      setDeleting(false)
    }
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedTenant || !user || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedTenant.id,
          userId: user.id,
          images: selectedImages
        })
      })

      if (response.ok) {
        const message = await response.json()
        // Lưu tin nhắn mới vào cache của tenant hiện tại
        setMessagesByTenant(prev => {
          const tenantId = selectedTenant.id
          const currentMessages = prev[tenantId] || []
          
          // Check if message already exists
          if (currentMessages.some(m => m.id === message.id)) {
            return prev
          }
          
          // Add new message and sort by createdAt
          const updated = [...currentMessages, message].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          
          return {
            ...prev,
            [tenantId]: updated
          }
        })
        setNewMessage('')
        setSelectedImages([])
        setTimeout(() => scrollToBottom(), 100)
      } else {
        const error = await response.json()
        alert(error.error || 'Không thể gửi tin nhắn')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Không thể gửi tin nhắn')
    } finally {
      setSending(false)
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const shouldShowDateSeparator = (current: Message, previous: Message | null) => {
    if (!previous) return true
    const currentDate = new Date(current.createdAt).toDateString()
    const previousDate = new Date(previous.createdAt).toDateString()
    return currentDate !== previousDate
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-tertiary">Đang tải tin nhắn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex relative" style={{ 
      backgroundColor: 'var(--bg-secondary)',
      height: 'calc(100vh - 4rem)',
      maxHeight: 'calc(100vh - 4rem)',
      overflow: 'hidden'
    }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden transition-opacity"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Danh sách tenants */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 sm:w-80 flex flex-col shadow-lg lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ 
        borderRight: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {/* Header */}
        <div className="px-2 sm:px-4 py-3" style={{ 
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Link
              href="/admin"
              className="p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ 
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Tin nhắn</h1>
              <p className="text-xs sm:text-sm leading-tight mt-0.5" style={{ color: 'var(--text-secondary)' }}>Quản lý tin nhắn với cư dân</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Tìm kiếm cư dân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm"
              style={{
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Tenants List */}
        <div className="flex-1 overflow-y-auto tenants-list" style={{ 
          minHeight: 0,
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none' /* IE and Edge */
        }}>
          {filteredTenants.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto mb-2" size={32} style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {searchTerm ? 'Không tìm thấy cư dân' : 'Chưa có cư dân nào'}
              </p>
            </div>
          ) : (
            filteredTenants.map((tenant) => {
              const unreadCount = unreadCounts[tenant.id] || 0
              const isSelected = selectedTenant?.id === tenant.id
              
              return (
                <div
                  key={tenant.id}
                  onClick={() => {
                    setSelectedTenant(tenant)
                    setSidebarOpen(false) // Close sidebar on mobile when selecting tenant
                  }}
                  className="px-2 sm:px-4 py-2 sm:py-4 cursor-pointer transition-all tenant-item"
                  style={{
                    borderBottom: '1px solid var(--border-primary)',
                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    borderLeft: isSelected ? '4px solid #8b5cf6' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Avatar */}
                    {tenant.avatarUrl ? (
                      <img
                        src={tenant.avatarUrl}
                        alt={tenant.fullName}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {tenant.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                        <h3 className="text-xs sm:text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {tenant.fullName}
                        </h3>
                        {unreadCount > 0 && (
                          <span className="flex-shrink-0 ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-white text-[10px] sm:text-xs font-semibold rounded-full unread-badge" style={{ backgroundColor: '#ef4444' }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <p className="text-[10px] sm:text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{tenant.phone}</p>
                        {tenant.room && (
                          <span className="text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1" style={{ color: '#8b5cf6' }}>
                            <Building2 size={10} className="sm:w-3 sm:h-3" />
                            {tenant.room.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {selectedTenant ? (
          <>
            {/* Chat Header */}
            <div className="px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-sm" style={{
              borderBottom: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Menu size={18} />
                </button>
                {selectedTenant.avatarUrl ? (
                  <img
                    src={selectedTenant.avatarUrl}
                    alt={selectedTenant.fullName}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {selectedTenant.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{selectedTenant.fullName}</h2>
                </div>
              </div>
              <button
                onClick={handleDeleteHistory}
                disabled={deleting}
                className="p-1.5 sm:p-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                style={{ color: '#ef4444' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Xóa lịch sử trò chuyện"
              >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4 messages-container"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                minHeight: 0,
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none' /* IE and Edge */
              }}
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-4" size={48} style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Chưa có tin nhắn nào</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Bắt đầu cuộc trò chuyện với {selectedTenant.fullName}</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isAdmin = message.sender.role === 'ADMIN'
                  const previousMessage = index > 0 ? messages[index - 1] : null
                  const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                  
                  // Show avatar and name when:
                  // 1. First message
                  // 2. Previous message is from different sender (different sender.id)
                  // 3. Previous message is from different role (admin vs tenant)
                  const showAvatar = !previousMessage || 
                    previousMessage.sender.id !== message.sender.id ||
                    previousMessage.sender.role !== message.sender.role
                  
                  // Add spacing when switching between different users
                  const showUserSeparator = previousMessage && 
                    previousMessage.sender.id !== message.sender.id &&
                    previousMessage.sender.role !== 'ADMIN' &&
                    !isAdmin
                  
                  // Show name for admin messages too when switching users
                  const showSenderName = showAvatar && (
                    !isAdmin || (previousMessage && previousMessage.sender.id !== message.sender.id)
                  )
                  
                  // Use a unique key combining message.id and index to prevent duplicate key errors
                  return (
                    <div key={`${message.id}-${index}-${message.createdAt}`}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-4 date-separator">
                          <span className="px-3 py-1 text-xs rounded-full" style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}>
                            {new Date(message.createdAt).toLocaleDateString('vi-VN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {showUserSeparator && (
                        <div className="my-4 border-t" style={{ borderColor: 'var(--border-primary)', opacity: 0.3 }}></div>
                      )}
                      <div className={`flex gap-1 sm:gap-2 ${showAvatar ? (isAdmin ? 'mt-2' : 'mt-3') : 'mb-1'} ${isAdmin ? 'justify-end' : 'justify-start'} message-bubble`}>
                        {!isAdmin && showAvatar && (
                          <div className="hidden sm:flex flex-col items-center flex-shrink-0" style={{ width: '32px' }}>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                              {message.sender.avatarUrl ? (
                                <img src={message.sender.avatarUrl} alt={message.sender.fullName} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover" />
                              ) : (
                                <span className="text-white text-[10px] sm:text-xs font-semibold">
                                  {message.sender.fullName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {!isAdmin && !showAvatar && (
                          <div className="flex-shrink-0 hidden sm:block" style={{ width: '32px' }}></div>
                        )}
                        <div className="flex flex-col max-w-[85%] sm:max-w-[70%]" style={{ alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                          {showSenderName && (
                            <p className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 px-1 ${isAdmin ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-secondary)' }}>
                              {message.sender.fullName}
                            </p>
                          )}
                          {(() => {
                            const hasImages = message.images && message.images.length > 0
                            const hasContent = message.content && message.content.trim()
                            const isImageOnly = hasImages && !hasContent
                            
                            return (
                              <div className={isImageOnly ? '' : `rounded-xl sm:rounded-2xl px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm message-bubble ${
                                isAdmin
                                  ? 'bg-blue-500 text-white rounded-tr-sm'
                                  : 'rounded-tl-sm'
                              }`}
                              style={isImageOnly ? {} : (!isAdmin ? {
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)'
                              } : {})}
                              >
                                {hasImages && (
                                  <div className={`flex flex-wrap gap-1 sm:gap-2 ${hasContent ? 'mb-1 sm:mb-2' : ''} ${message.images.length === 1 ? 'justify-center' : ''}`}>
                                    {message.images.map((image, idx) => (
                                      <img
                                        key={idx}
                                        src={image}
                                        alt={`Image ${idx + 1}`}
                                        className="h-auto rounded-lg cursor-pointer hover:opacity-90 max-w-[200px] sm:max-w-xs message-image"
                                        style={{ border: 'none', display: 'block' }}
                                        onClick={() => setViewingImage(image)}
                                      />
                                    ))}
                                  </div>
                                )}
                                {hasContent && (
                                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                        {isAdmin && (
                          <div className="flex-shrink-0 hidden sm:block" style={{ width: '32px' }}></div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-2 sm:px-4 py-2 sm:py-3 input-area" style={{
              borderTop: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)'
            }}>
              {/* Selected Images Preview */}
              {selectedImages.length > 0 && (
                <div className="mb-2 sm:mb-3 flex gap-1.5 sm:gap-2 flex-wrap">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 image-preview"
                        style={{ borderColor: 'var(--border-primary)' }}
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-0.5 sm:p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-1.5 sm:gap-2 items-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  style={{
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingImages) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingImages) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                    }
                  }}
                  title="Tải ảnh lên"
                >
                  <ImageIcon size={18} className="sm:w-5 sm:h-5" />
                </button>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-32 message-input text-xs sm:text-sm"
                  style={{ 
                    minHeight: '36px',
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && selectedImages.length === 0) || sending}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 shadow-md send-button flex-shrink-0 text-xs sm:text-sm"
                >
                  <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">{sending ? 'Đang gửi...' : 'Gửi'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4" size={48} style={{ color: 'var(--text-tertiary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Chọn một cư dân để xem tin nhắn</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            style={{ color: 'white' }}
          >
            <X size={24} />
          </button>
          <div 
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewingImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
