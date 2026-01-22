'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, User, Image as ImageIcon, X, Trash2 } from 'lucide-react'

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

interface Admin {
  id: number
  fullName: string
  avatarUrl: string | null
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchMessages(parsedUser.id)
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Real-time connection with SSE
  useEffect(() => {
    if (!user || !admin) {
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
        `/api/messages/stream?userId=${user.id}&otherUserId=${admin.id}&role=TENANT`
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
            setMessages(prev => {
              const existingIds = new Set(prev.map(m => m.id))
              const newMessages = data.messages.filter((m: Message) => !existingIds.has(m.id))
              if (newMessages.length > 0) {
                // Show push notification for new messages from admin
                const adminMessages = newMessages.filter((m: Message) => m.sender.role === 'ADMIN')
                if (adminMessages.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
                  // Only show notification if page is not focused
                  if (document.hidden || !document.hasFocus()) {
                    const latestMessage = adminMessages[adminMessages.length - 1]
                    const notificationText = latestMessage.content 
                      ? (latestMessage.content.length > 50 ? latestMessage.content.substring(0, 50) + '...' : latestMessage.content)
                      : 'Có hình ảnh đính kèm'
                    
                    new Notification('Tin nhắn mới từ quản lý', {
                      body: notificationText,
                      icon: '/favicon.ico',
                      badge: '/favicon.ico',
                      tag: 'message-notification',
                      requireInteraction: false
                    })
                  }
                }
                
                return [...prev, ...newMessages]
              }
              return prev
            })
            
            // Update unread count
            fetchUnreadCount(user.id)
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
            if (user && admin) {
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
  }, [user, admin])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchMessages = async (userId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tenant/messages?userId=${userId}`)
      const data = await response.json()
      
      setMessages(data.messages || [])
      setUnreadCount(data.unreadCount || 0)
      
      // Lấy thông tin admin từ tin nhắn đầu tiên hoặc từ API response
      if (data.messages && data.messages.length > 0) {
        const firstMessage = data.messages[0]
        const adminUser = firstMessage.sender.role === 'ADMIN' 
          ? firstMessage.sender 
          : firstMessage.receiver.role === 'ADMIN' 
            ? firstMessage.receiver 
            : null
        
        if (adminUser) {
          setAdmin({
            id: adminUser.id,
            fullName: adminUser.fullName,
            avatarUrl: adminUser.avatarUrl
          })
        }
      } else if (data.admin) {
        // Nếu API trả về admin info
        setAdmin({
          id: data.admin.id,
          fullName: data.admin.fullName,
          avatarUrl: data.admin.avatarUrl
        })
      } else {
        // Nếu chưa có tin nhắn, lấy admin từ database
        try {
          const adminResponse = await fetch(`/api/tenant/messages?userId=${userId}`)
          const adminData = await adminResponse.json()
          if (adminData.admin) {
            setAdmin(adminData.admin)
          }
        } catch (e) {
          // Ignore
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async (userId: number) => {
    try {
      const response = await fetch(`/api/messages/unread-count?userId=${userId}`)
      const data = await response.json()
      setUnreadCount(data.count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      // Fallback to messages API
      try {
        const response = await fetch(`/api/tenant/messages?userId=${userId}`)
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      } catch (e) {
        console.error('Error fetching unread count from messages API:', e)
      }
    }
  }

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
    if (!user) return
    
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/tenant/messages/delete?userId=${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages([])
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
    if ((!newMessage.trim() && selectedImages.length === 0) || !user || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/tenant/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          userId: user.id,
          images: selectedImages
        })
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
        setSelectedImages([])
        
        // Cập nhật thông tin admin nếu chưa có
        if (!admin && message.receiver.role === 'ADMIN') {
          setAdmin({
            id: message.receiver.id,
            fullName: message.receiver.fullName,
            avatarUrl: message.receiver.avatarUrl
          })
        }
        
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải tin nhắn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ 
      backgroundColor: 'var(--bg-secondary)',
      height: 'calc(100vh - 4rem)',
      maxHeight: 'calc(100vh - 4rem)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between shadow-sm" style={{
        borderBottom: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div className="flex items-center gap-3">
          <Link
            href="/tenant"
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Tin nhắn</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Liên hệ với quản lý</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <span className="text-sm font-semibold unread-badge" style={{ color: '#ef4444' }}>
                {unreadCount} tin chưa đọc
              </span>
            </div>
          )}
          <button
            onClick={handleDeleteHistory}
            disabled={deleting}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ color: '#ef4444' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Xóa lịch sử trò chuyện"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 messages-container"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
          minHeight: 0
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4" size={48} style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Chưa có tin nhắn</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Bắt đầu cuộc trò chuyện với quản lý</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isTenant = message.sender.role === 'TENANT'
            const previousMessage = index > 0 ? messages[index - 1] : null
            const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
            const showAvatar = !previousMessage || previousMessage.sender.id !== message.sender.id
            
            return (
              <div key={message.id}>
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
                <div className={`flex gap-2 mb-1 ${isTenant ? 'justify-end' : 'justify-start'} message-bubble`}>
                  {!isTenant && showAvatar && (
                    <div className="flex flex-col items-center flex-shrink-0" style={{ width: '40px' }}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                        {message.sender.avatarUrl ? (
                          <img src={message.sender.avatarUrl} alt={message.sender.fullName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {message.sender.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {!isTenant && !showAvatar && (
                    <div className="flex-shrink-0" style={{ width: '40px' }}></div>
                  )}
                  <div className="flex flex-col max-w-[70%]" style={{ alignItems: isTenant ? 'flex-end' : 'flex-start' }}>
                    {!isTenant && showAvatar && (
                      <p className="text-xs mb-1 px-1" style={{ color: 'var(--text-secondary)' }}>
                        {message.sender.fullName}
                      </p>
                    )}
                    {(() => {
                      const hasImages = message.images && message.images.length > 0
                      const hasContent = message.content && message.content.trim()
                      const isImageOnly = hasImages && !hasContent
                      
                      return (
                        <div className={isImageOnly ? '' : `rounded-2xl px-4 py-2 shadow-sm message-bubble ${
                          isTenant
                            ? 'bg-blue-500 text-white rounded-tr-sm'
                            : 'rounded-tl-sm'
                        }`}
                        style={isImageOnly ? {} : (!isTenant ? {
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)'
                        } : {})}
                        >
                          {hasImages && (
                            <div className={`flex flex-wrap gap-2 ${hasContent ? 'mb-2' : ''} ${message.images.length === 1 ? 'justify-center' : ''}`}>
                              {message.images.map((image, idx) => (
                                <img
                                  key={idx}
                                  src={image}
                                  alt={`Image ${idx + 1}`}
                                  className="h-auto rounded-lg cursor-pointer hover:opacity-90 max-w-xs message-image"
                                  style={{ border: 'none', display: 'block' }}
                                  onClick={() => setViewingImage(image)}
                                />
                              ))}
                            </div>
                          )}
                          {hasContent && (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  {isTenant && (
                    <div className="flex-shrink-0" style={{ width: '40px' }}></div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 input-area" style={{
        borderTop: '1px solid var(--border-primary)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 image-preview"
                  style={{ borderColor: 'var(--border-primary)' }}
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 items-end">
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
            className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
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
            <ImageIcon size={20} />
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
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-32 message-input"
            style={{ 
              minHeight: '40px',
              borderColor: 'var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && selectedImages.length === 0) || sending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md send-button"
          >
            <Send size={18} />
            {sending ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
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
