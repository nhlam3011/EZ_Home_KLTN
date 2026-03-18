'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, Image as ImageIcon, X, Trash2, Phone, Video } from 'lucide-react'
import Loading from '@/components/Loading'
import { pusherClient } from '@/lib/pusher-client'
import { CHANNELS, EVENTS } from '@/lib/pusher-shared'

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
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isMeTyping, setIsMeTyping] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchMessages(parsedUser.id)
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      })
    }
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetch(`/api/tenant/messages?userId=${user.id}`).catch(err => console.error('Error marking as read on focus:', err))
        setUnreadCount(0)
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        handleFocus()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user) return

    const channel = pusherClient.subscribe(CHANNELS.TENANT_MESSAGES)

    channel.bind(EVENTS.NEW_MESSAGE, (data: { message: Message, tenantId: number }) => {
      const { message, tenantId } = data

      if (tenantId !== user.id) return

      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev
        return [...prev, message].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      })

      if (message.sender.role === 'ADMIN') {
        if (!document.hidden && document.hasFocus()) {
          fetch(`/api/tenant/messages?userId=${user.id}`).catch(err => console.error('Error marking as read:', err))
          setUnreadCount(0)
        } else {
          setUnreadCount(prev => prev + 1)
        }

        if (document.hidden || !document.hasFocus()) {
          const notificationText = message.content
            ? (message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content)
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
    })

    channel.bind(EVENTS.TYPING, (data: { senderId: number, senderRole: string, receiverId: number, isTyping: boolean }) => {
      if (data.senderRole === 'ADMIN' && data.receiverId === user.id) {
        setIsTyping(data.isTyping)
      }
    })

    return () => {
      pusherClient.unsubscribe(CHANNELS.TENANT_MESSAGES)
    }
  }, [user])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const fetchMessages = async (userId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tenant/messages?userId=${userId}`)
      const data = await response.json()

      setMessages(data.messages || [])
      setUnreadCount(0) // Clear unread count when viewing

      if (data.admin) {
        setAdmin(data.admin)
      } else if (data.messages && data.messages.length > 0) {
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
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
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

  const handleDeleteHistory = () => {
    if (!user) return
    setShowDeleteModal(true)
  }

  const handleTyping = (typing: boolean) => {
    if (!user || !admin) return

    if (typing && !isMeTyping) {
      setIsMeTyping(true)
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: admin.id,
          senderId: user.id,
          senderRole: 'TENANT',
          isTyping: true
        })
      }).catch(err => console.error('Error reporting typing:', err))
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      setIsMeTyping(false)
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: admin.id,
          senderId: user.id,
          senderRole: 'TENANT',
          isTyping: false
        })
      }).catch(err => console.error('Error reporting typing stopped:', err))
    }, 2000)
  }

  const confirmDeleteHistory = async () => {
    if (!user) return

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

    const contentToSend = newMessage
    const imagesToSend = [...selectedImages]

    const tempId = Date.now()
    const optimisticMessage: Message = {
      id: tempId,
      content: contentToSend,
      images: imagesToSend,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        fullName: user.fullName || 'Tenant',
        avatarUrl: user.avatarUrl || null,
        role: 'TENANT'
      },
      receiver: {
        id: admin?.id || 0,
        fullName: admin?.fullName || 'Admin',
        avatarUrl: admin?.avatarUrl || null,
        role: 'ADMIN'
      }
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setSelectedImages([])
    setTimeout(() => scrollToBottom(), 50)

    setSending(true)
    try {
      const response = await fetch('/api/tenant/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: contentToSend,
          userId: user.id,
          images: imagesToSend
        })
      })

      if (response.ok) {
        const confirmedMessage = await response.json()
        setMessages(prev => prev.map(m => m.id === tempId ? confirmedMessage : m))

        if (!admin && confirmedMessage.receiver.role === 'ADMIN') {
          setAdmin({
            id: confirmedMessage.receiver.id,
            fullName: confirmedMessage.receiver.fullName,
            avatarUrl: confirmedMessage.receiver.avatarUrl
          })
        }
      } else {
        const error = await response.json()
        setMessages(prev => prev.filter(m => m.id !== tempId))
        alert(error.error || 'Không thể gửi tin nhắn')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
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

  const shouldShowDateSeparator = (current: Message, previous: Message | null) => {
    if (!previous) return true
    const currentDate = new Date(current.createdAt).toDateString()
    const previousDate = new Date(previous.createdAt).toDateString()
    return currentDate !== previousDate
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loading size="lg" text="Đang tải tin nhắn..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[var(--bg-secondary)] transition-colors duration-300">
      {/* Header - Messenger Style */}
      <header className="flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-primary)] z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href="/tenant"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {admin?.avatarUrl ? (
                <img
                  src={admin.avatarUrl}
                  className="w-11 h-11 rounded-2xl object-cover shadow-sm transition-all group-hover:ring-2 group-hover:ring-[var(--accent-blue)]"
                  alt=""
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-white font-bold shadow-md">
                  {admin?.fullName ? admin.fullName.charAt(0).toUpperCase() : 'BQL'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-[3px] border-[var(--bg-primary)]" />
            </div>

            <div className="flex-1 flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-bold text-[var(--text-primary)] leading-tight truncate group-hover:underline decoration-blue-500/30 underline-offset-2">
                  Ban Quản Lý
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:bg-[var(--bg-tertiary)] text-[var(--accent-blue)] active:scale-90">
            <Phone size={18} fill="currentColor" fillOpacity={0.1} />
          </button>
          <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:bg-[var(--bg-tertiary)] text-[var(--accent-blue)] active:scale-90">
            <Video size={18} fill="currentColor" fillOpacity={0.1} />
          </button>
          <button
            onClick={handleDeleteHistory}
            disabled={deleting}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:bg-red-50 text-red-500 disabled:opacity-50 active:scale-90"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Centered Unread Count Notification */}
        {unreadCount > 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-red-500 text-white shadow-xl shadow-red-500/30 animate-pulse z-[20] top-20 border border-white/20 backdrop-blur-md">
            <span className="text-[11px] font-black uppercase tracking-wider">
              {unreadCount} tin nhắn mới
            </span>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar bg-transparent"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-60">
            <div className="w-32 h-32 rounded-full bg-gradient-to-b from-[var(--bg-tertiary)] to-transparent flex items-center justify-center mb-6">
              <MessageSquare size={48} className="text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Chưa có tin nhắn</h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-xs text-center font-medium leading-relaxed">
              Xin chào! Ban quản lý luôn sẵn sàng hỗ trợ bạn. Hãy gửi tin nhắn nếu bạn có thắc mắc gì nhé.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isTenant = message.sender.role === 'TENANT'
            const previousMessage = index > 0 ? messages[index - 1] : null
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
            const showDateSeparator = shouldShowDateSeparator(message, previousMessage)

            const isLastInGroup = !nextMessage || nextMessage.sender.id !== message.sender.id || shouldShowDateSeparator(nextMessage, message)
            const isFirstInGroup = !previousMessage || previousMessage.sender.id !== message.sender.id || showDateSeparator
            const isMiddleInGroup = !isFirstInGroup && !isLastInGroup

            return (
              <div key={`${message.id}-${index}`} className="flex flex-col group/msg">
                {showDateSeparator && (
                  <div className="flex justify-center my-6">
                    <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] uppercase tracking-widest shadow-sm">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-2.5 ${isTenant ? 'flex-row-reverse' : 'flex-row'} ${isLastInGroup ? 'mb-3.5' : 'mb-[2px]'}`}>
                  {!isTenant && (
                    <div className="w-8 flex-shrink-0 animate-fadeIn">
                      {isLastInGroup && (
                        <div className="relative">
                          {admin?.avatarUrl ? (
                            <img
                              src={admin.avatarUrl}
                              className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-white/20"
                              alt=""
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-white text-[10px] font-bold">
                              {admin?.fullName ? admin.fullName.charAt(0).toUpperCase() : 'BQL'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isTenant ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`message-bubble relative transition-all duration-200 shadow-sm ${isTenant ? 'bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}
                      style={{
                        padding: message.images?.length > 0 ? '4px' : '10px 14px',
                        borderRadius: isTenant
                          ? (isFirstInGroup && isLastInGroup ? '20px 20px 4px 20px' :
                            isFirstInGroup ? '20px 20px 4px 20px' :
                              isLastInGroup ? '20px 4px 20px 20px' : '20px 4px 4px 20px')
                          : (isFirstInGroup && isLastInGroup ? '20px 20px 20px 4px' :
                            isFirstInGroup ? '20px 20px 20px 4px' :
                              isLastInGroup ? '4px 20px 20px 20px' : '4px 20px 20px 4px'),
                      }}
                    >
                      {message.images && message.images.length > 0 && (
                        <div className={`grid gap-1 overflow-hidden ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ borderRadius: '16px' }}>
                          {message.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt=""
                              className="cursor-zoom-in hover:brightness-110 transition-all w-full h-auto max-h-72 object-cover rounded-lg"
                              onClick={() => setViewingImage(img)}
                            />
                          ))}
                        </div>
                      )}

                      {message.content && (
                        <p className={`text-[15px] leading-snug whitespace-pre-wrap break-words ${message.images?.length > 0 ? 'px-3 py-2' : ''}`}>
                          {message.content}
                        </p>
                      )}
                    </div>

                    {isLastInGroup && (
                      <div className={`mt-1 flex items-center gap-1 px-1 transition-opacity duration-300 ${isTenant ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] font-medium text-[var(--text-tertiary)]/70">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isTenant && message.isRead && (
                          <span className="text-[10px] font-bold text-[var(--accent-blue)] ml-1">Đã xem</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-end gap-2.5 mb-4 animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {admin?.fullName ? admin.fullName.charAt(0).toUpperCase() : 'BQL'}
            </div>
            <div className="px-4 py-3 bg-[var(--bg-tertiary)] rounded-[20px] rounded-bl-none shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area - Messenger Style */}
      <div className="p-4 bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-[var(--border-primary)] safe-bottom">
        {selectedImages.length > 0 && (
          <div className="mb-4 flex gap-3 overflow-x-auto pb-2 scroll-hide">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative flex-shrink-0 animate-scaleIn">
                <img
                  src={image}
                  alt=""
                  className="w-20 h-20 object-cover rounded-2xl ring-2 ring-[var(--accent-blue)]/10 shadow-lg"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center gap-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-blue)] transition-all group"
            >
              <ImageIcon size={20} />
              <span className="text-[10px] font-bold">Thêm</span>
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end max-w-5xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />

          <div className="flex items-center gap-1 sm:gap-2 mr-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              className="w-[50px] h-[50px] rounded-full flex items-center justify-center bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 transition-all shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Đính kèm ảnh"
            >
              <ImageIcon size={22} fill="currentColor" fillOpacity={0.1} />
            </button>
          </div>

          <div className="flex-1 h-[50px] relative bg-[var(--bg-tertiary)] rounded-[24px] overflow-hidden border border-transparent focus-within:border-[var(--accent-blue)]/30 focus-within:ring-4 focus-within:ring-[var(--accent-blue)]/5 transition-all flex items-center">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Aa"
              rows={1}
              className="w-full px-5 bg-transparent border-none focus:ring-0 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]/70 resize-none max-h-40 py-[14px] custom-scrollbar"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && selectedImages.length === 0) || sending}
            className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all bg-[var(--accent-blue)] text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed group"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-[110]"
          >
            <X size={28} />
          </button>
          <img
            src={viewingImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-scaleIn"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-[var(--bg-primary)] rounded-[32px] max-w-sm w-full p-8 shadow-2xl animate-scaleIn border border-[var(--border-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3 text-center tracking-tight">Xóa lịch sử?</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-center text-[14px]">
              Tất cả nội dung của cuộc trò chuyện này sẽ được xóa vĩnh viễn khỏi thiết bị của bạn.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDeleteHistory}
                disabled={deleting}
                className="w-full py-4 rounded-2xl bg-red-500 text-white text-[15px] font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {deleting ? 'Đang dọn dẹp...' : 'Xác nhận xóa'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-4 rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-[15px] font-bold transition-all hover:bg-[var(--border-primary)]"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-primary);
          border-radius: 10px;
        }
        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .safe-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}
