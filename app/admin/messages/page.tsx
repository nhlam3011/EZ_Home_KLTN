'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { MessageSquare, Send, Search, ArrowLeft, Image as ImageIcon, X, Trash2, Building2, Menu, Phone, Video, Smile } from 'lucide-react'
import Link from 'next/link'
import Loading from '@/components/Loading'
import { pusherClient } from '@/lib/pusher-client'
import { CHANNELS, EVENTS } from '@/lib/pusher-shared'
import { useBuilding } from '@/components/BuildingContext'

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
  lastMessage?: {
    content: string
    createdAt: string
    images: string[]
    senderRole: string
  } | null
}

export default function AdminMessagesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [messagesByTenant, setMessagesByTenant] = useState<Record<number, Message[]>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { selectedBuildingId } = useBuilding()
  const [user, setUser] = useState<any>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isMeTyping, setIsMeTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadUserAndMessages = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
            setUser(parsedUser)
            fetchMessages(parsedUser.id)
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }

    loadUserAndMessages()

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      })
    }
  }, [])

  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout | null = null

    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout)
        }
        debounceTimeout = setTimeout(() => {
          const userData = localStorage.getItem('user')
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData)
              if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
                setUser(parsedUser)
                if (selectedTenant && !messagesByTenant[selectedTenant.id]) {
                  fetchMessagesWithTenant(selectedTenant.id, parsedUser.id)
                }
              }
            } catch (error) {
              console.error('Error parsing user data on visibility change:', error)
            }
          }
        }, 500)
      }
    }

    const handleFocus = () => {
      if (selectedTenant && user) {
        fetch(`/api/admin/messages/${selectedTenant.id}?userId=${user.id}`).catch(err => console.error('Error marking as read on focus:', err))
        setUnreadCounts(prev => ({
          ...prev,
          [selectedTenant.id]: 0
        }))
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [user, selectedTenant, messagesByTenant])

  const messages = selectedTenant ? (messagesByTenant[selectedTenant.id] || []) : []

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedTenant])

  useEffect(() => {
    if (!user) return

    const channel = pusherClient.subscribe(CHANNELS.ADMIN_MESSAGES)

    channel.bind(EVENTS.NEW_MESSAGE, (data: { message: Message, adminId: number }) => {
      const { message } = data

      const tenantId = message.sender.role === 'TENANT' ? message.sender.id : message.receiver.id

      setMessagesByTenant(prev => {
        const currentMessages = prev[tenantId] || []
        if (currentMessages.some(m => m.id === message.id)) return prev

        return {
          ...prev,
          [tenantId]: [...currentMessages, message].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        }
      })

      if (message.sender.role === 'TENANT') {
        const fromTenantId = message.sender.id

        if (selectedTenant && selectedTenant.id === fromTenantId && !document.hidden && document.hasFocus()) {
          fetch(`/api/admin/messages/${fromTenantId}?userId=${user.id}`).catch(err => console.error('Error marking as read:', err))
          setUnreadCounts(prev => ({
            ...prev,
            [fromTenantId]: 0
          }))
        } else {
          setUnreadCounts(prev => ({
            ...prev,
            [fromTenantId]: (prev[fromTenantId] || 0) + 1
          }))
        }

        setTenants(prev => {
          const tenantIndex = prev.findIndex(t => t.id === fromTenantId)
          if (tenantIndex === -1) {
            fetchMessages(user.id)
            return prev
          }

          const updatedTenant = {
            ...prev[tenantIndex],
            lastMessage: {
              content: message.content,
              createdAt: message.createdAt,
              images: message.images,
              senderRole: 'TENANT'
            }
          }

          const filtered = prev.filter(t => t.id !== fromTenantId)
          return [updatedTenant, ...filtered]
        })

        if (document.hidden || !document.hasFocus() || (selectedTenant && selectedTenant.id !== fromTenantId)) {
          const notificationText = message.content
            ? (message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content)
            : 'Có hình ảnh đính kèm'

          new Notification(`Tin nhắn mới từ ${message.sender.fullName}`, {
            body: notificationText,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'message-notification',
            requireInteraction: false
          })
        }
      } else {
        // Tin nhắn từ Admin (có thể từ thiết bị khác)
        const toTenantId = message.receiver.id
        setTenants(prev => {
          const tenantIndex = prev.findIndex(t => t.id === toTenantId)
          if (tenantIndex === -1) return prev

          const updatedTenant = {
            ...prev[tenantIndex],
            lastMessage: {
              content: message.content,
              createdAt: message.createdAt,
              images: message.images,
              senderRole: 'ADMIN'
            }
          }

          const filtered = prev.filter(t => t.id !== toTenantId)
          return [updatedTenant, ...filtered]
        })
      }
    })

    channel.bind(EVENTS.TYPING, (data: { senderId: number, senderRole: string, receiverId: number, isTyping: boolean }) => {
      if (data.senderRole === 'TENANT' && selectedTenant && selectedTenant.id === data.senderId) {
        setIsTyping(data.isTyping)
      }
    })

    return () => {
      pusherClient.unsubscribe(CHANNELS.ADMIN_MESSAGES)
    }
  }, [user, selectedTenant])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (selectedTenant) {
      setUnreadCounts(prev => ({
        ...prev,
        [selectedTenant.id]: 0
      }))
    }
  }, [selectedTenant])

  const fetchMessages = async (userId: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('userId', userId.toString())
      if (selectedBuildingId) params.append('buildingId', selectedBuildingId.toString())

      const response = await fetch(`/api/admin/messages?${params.toString()}`)
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const userData = localStorage.getItem('user')
          if (!userData) {
            console.error('User not found in localStorage')
            return
          }
          try {
            const parsedUser = JSON.parse(userData)
            if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
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
      setUnreadCounts(prev => {
        const counts = { ...data.unreadCounts }
        if (selectedTenant) {
          counts[selectedTenant.id] = 0
        }
        return counts
      })

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
          const userData = localStorage.getItem('user')
          if (!userData) {
            console.error('User not found in localStorage')
            return
          }
          try {
            const parsedUser = JSON.parse(userData)
            if (parsedUser && parsedUser.id && parsedUser.role === 'ADMIN') {
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

  useEffect(() => {
    if (user) {
      fetchMessages(user.id)
    }
  }, [selectedBuildingId, user])

  useEffect(() => {
    if (selectedTenant && user && !messagesByTenant[selectedTenant.id]) {
      fetchMessagesWithTenant(selectedTenant.id, user.id)
    }
  }, [selectedTenant])

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

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const files: File[] = []

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      setUploadingImages(true)
      try {
        const uploadPromises = files.map(async (file) => {
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
      }
    }
  }

  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const text = newMessage
      const before = text.substring(0, start)
      const after = text.substring(end)
      setNewMessage(before + emoji + after)

      // Reset cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length)
        }
      }, 0)
    } else {
      setNewMessage(prev => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const emojis = ['😊', '😂', '🥰', '😍', '😒', '😭', '👍', '❤️', '🔥', '✨', '✔️', '❌', '🏠', '🔑', '💰', '📅']

  const handleDeleteHistory = () => {
    if (!selectedTenant || !user) return
    setShowDeleteModal(true)
  }

  const confirmDeleteHistory = async () => {
    if (!selectedTenant || !user) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/messages/${selectedTenant.id}?userId=${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
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

  const handleTyping = (typing: boolean) => {
    if (!user || !selectedTenant) return

    if (typing && !isMeTyping) {
      setIsMeTyping(true)
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedTenant.id,
          senderId: user.id,
          senderRole: 'ADMIN',
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
          receiverId: selectedTenant.id,
          senderId: user.id,
          senderRole: 'ADMIN',
          isTyping: false
        })
      }).catch(err => console.error('Error reporting typing stopped:', err))
    }, 2000)
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedTenant || !user || sending) return

    const contentToSend = newMessage
    const imagesToSend = [...selectedImages]
    const tenantId = selectedTenant.id

    const tempId = Date.now()
    const optimisticMessage: Message = {
      id: tempId,
      content: contentToSend,
      images: imagesToSend,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        fullName: user.fullName || 'Admin',
        avatarUrl: user.avatarUrl || null,
        role: 'ADMIN'
      },
      receiver: {
        id: selectedTenant.id,
        fullName: selectedTenant.fullName,
        avatarUrl: selectedTenant.avatarUrl,
        role: 'TENANT'
      }
    }

    setMessagesByTenant(prev => {
      const currentMessages = prev[tenantId] || []
      return {
        ...prev,
        [tenantId]: [...currentMessages, optimisticMessage]
      }
    })

    setNewMessage('')
    setSelectedImages([])
    setTimeout(() => scrollToBottom(), 50)

    setSending(true)
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: contentToSend,
          receiverId: tenantId,
          userId: user.id,
          images: imagesToSend
        })
      })

      if (response.ok) {
        const confirmedMessage = await response.json()
        setMessagesByTenant(prev => {
          const currentMessages = prev[tenantId] || []
          return {
            ...prev,
            [tenantId]: currentMessages.map(m => m.id === tempId ? confirmedMessage : m)
          }
        })

        setTenants(prev => {
          const tenantIndex = prev.findIndex(t => t.id === tenantId)
          if (tenantIndex === -1) return prev

          const updatedTenant = {
            ...prev[tenantIndex],
            lastMessage: {
              content: confirmedMessage.content,
              createdAt: confirmedMessage.createdAt,
              images: confirmedMessage.images,
              senderRole: 'ADMIN'
            }
          }

          const filtered = prev.filter(t => t.id !== tenantId)
          return [updatedTenant, ...filtered]
        })
      } else {
        const error = await response.json()
        setMessagesByTenant(prev => ({
          ...prev,
          [tenantId]: (prev[tenantId] || []).filter(m => m.id !== tempId)
        }))
        alert(error.error || 'Không thể gửi tin nhắn')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessagesByTenant(prev => ({
        ...prev,
        [tenantId]: (prev[tenantId] || []).filter(m => m.id !== tempId)
      }))
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

  const filteredTenants = tenants.filter(tenant =>
    tenant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loading size="lg" text="Đang tải tin nhắn..." />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[var(--bg-secondary)] transition-colors duration-300">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Danh sách cư dân */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 flex flex-col
        transform transition-all duration-300 ease-in-out
        border-r border-[var(--border-primary)]
        bg-[var(--bg-primary)]
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Chat</h1>
              <p className="text-xs text-[var(--text-tertiary)]">Hỗ trợ cư dân</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Tìm kiếm cư dân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 placeholder-[var(--text-tertiary)]/60"
            />
          </div>
        </div>

        {/* Tenants List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredTenants.length === 0 ? (
            <div className="p-8 text-center mt-10">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4 mx-auto animate-pulse">
                <MessageSquare size={28} className="text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm text-[var(--text-tertiary)] font-medium">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có hội thoại'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredTenants.map((tenant) => {
                const unreadCount = unreadCounts[tenant.id] || 0
                const isSelected = selectedTenant?.id === tenant.id
                const lastMessage = messagesByTenant[tenant.id]?.slice(-1)[0]

                return (
                  <div
                    key={tenant.id}
                    onClick={() => {
                      setSelectedTenant(tenant)
                      setSidebarOpen(false)
                    }}
                    className={`
                      relative px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 group
                      ${isSelected
                        ? 'bg-[var(--accent-blue-light)]/20'
                        : 'hover:bg-[var(--bg-tertiary)]'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        {tenant.avatarUrl ? (
                          <img
                            src={tenant.avatarUrl}
                            alt={tenant.fullName}
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20">
                            {tenant.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-[3px] border-[var(--bg-primary)] group-hover:scale-110 transition-transform" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-[15px] truncate transition-colors ${isSelected || unreadCount > 0 ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                            {tenant.fullName}
                          </h3>
                          {unreadCount > 0 && (
                            <span className="flex-shrink-0 ml-2 w-5 h-5 bg-[var(--accent-blue)] text-white text-[10px] font-bold rounded-full animate-bounce flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                          {!unreadCount && tenant.lastMessage && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">{formatDate(tenant.lastMessage.createdAt)}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {tenant.lastMessage ? (
                            <p className={`text-xs truncate ${unreadCount > 0 ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                              {tenant.lastMessage.senderRole === 'ADMIN' ? 'Bạn: ' : ''}
                              {tenant.lastMessage.content || 'Đã gửi một ảnh'}
                            </p>
                          ) : (
                            <p className="text-[11px] truncate text-[var(--text-tertiary)]">
                              Bắt đầu nhắn tin ngay
                            </p>
                          )}
                          {tenant.room && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-purple)]">
                              <Building2 size={10} />
                              {tenant.room.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-secondary)] relative">
        {selectedTenant ? (
          <>
            {/* Chat Header - Messenger Style */}
            <header className="flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-primary)] z-10 sticky top-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shrink-0"
                >
                  <Menu size={20} />
                </button>
                <div className="relative group flex-shrink-0 cursor-pointer">
                  {selectedTenant.avatarUrl ? (
                    <img
                      src={selectedTenant.avatarUrl}
                      alt={selectedTenant.fullName}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm transition-all group-hover:ring-2 group-hover:ring-[var(--accent-blue)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-white font-bold shadow-md">
                      {selectedTenant.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-primary)]" />
                </div>

                <div className="flex-1 flex flex-col min-w-0 pr-2 ml-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-[17px] font-bold text-[var(--text-primary)] leading-tight truncate">
                      {selectedTenant?.fullName}
                    </h1>
                  </div>
                  {selectedTenant?.room && (
                    <p className="text-[12px] text-[var(--text-tertiary)] truncate">
                      Phòng {selectedTenant.room.name} • Tầng {selectedTenant.room.floor}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
                <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-[var(--bg-tertiary)] text-[var(--accent-blue)] active:scale-90">
                  <Phone size={20} fill="currentColor" fillOpacity={0.1} />
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-[var(--bg-tertiary)] text-[var(--accent-blue)] active:scale-90">
                  <Video size={20} fill="currentColor" fillOpacity={0.1} />
                </button>
                <button
                  onClick={handleDeleteHistory}
                  disabled={deleting}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-red-50 text-red-500 disabled:opacity-50 active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </header>

            {/* Centered Unread Count Notification */}
            {selectedTenant && unreadCounts[selectedTenant.id] > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-red-500 text-white shadow-xl shadow-red-500/30 animate-pulse z-[20] top-20 border border-white/20 backdrop-blur-md">
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {unreadCounts[selectedTenant.id]} tin nhắn mới
                </span>
              </div>
            )}

            {/* Chat Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar bg-transparent"
            >
              {(messagesByTenant[selectedTenant.id] || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-60">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-b from-[var(--bg-tertiary)] to-transparent flex items-center justify-center mb-6">
                    <MessageSquare size={48} className="text-[var(--text-tertiary)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Chưa có tin nhắn</h3>
                  <p className="text-sm text-[var(--text-tertiary)] max-w-xs text-center">
                    Hãy bắt đầu cuộc trò chuyện với cư dân để hỗ trợ họ một cách tốt nhất.
                  </p>
                </div>
              ) : (
                messagesByTenant[selectedTenant.id].map((message, index) => {
                  const isAdmin = message.sender.role === 'ADMIN'
                  const previousMessage = index > 0 ? messagesByTenant[selectedTenant.id][index - 1] : null
                  const nextMessage = index < messagesByTenant[selectedTenant.id].length - 1 ? messagesByTenant[selectedTenant.id][index + 1] : null
                  const showDateSeparator = shouldShowDateSeparator(message, previousMessage)

                  const isLastInGroup = !nextMessage || nextMessage.sender.id !== message.sender.id || shouldShowDateSeparator(nextMessage, message)
                  const isFirstInGroup = !previousMessage || previousMessage.sender.id !== message.sender.id || showDateSeparator

                  return (
                    <div key={`${message.id}-${index}`} className="flex flex-col group/msg">
                      {showDateSeparator && (
                        <div className="flex justify-center my-6">
                          <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] uppercase tracking-widest shadow-sm">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}

                      <div className={`flex items-end gap-2.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'} ${isLastInGroup ? 'mb-3.5' : 'mb-[2px]'}`}>
                        {!isAdmin && (
                          <div className="w-8 flex-shrink-0 animate-fadeIn">
                            {isLastInGroup && (
                              <div className="relative">
                                {selectedTenant?.avatarUrl ? (
                                  <img
                                    src={selectedTenant.avatarUrl}
                                    className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-white/20"
                                    alt=""
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-white text-[10px] font-bold">
                                    {selectedTenant?.fullName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'}`}>
                          {message.images && message.images.length > 0 && (
                            <div className={`grid gap-1 mb-1 overflow-hidden ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ borderRadius: '16px' }}>
                              {message.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt=""
                                  className="cursor-zoom-in hover:brightness-110 transition-all w-full h-auto max-h-72 object-cover rounded-xl shadow-sm"
                                  onClick={() => setViewingImage(img)}
                                />
                              ))}
                            </div>
                          )}

                          {message.content && (
                            <div
                              className={`message-bubble relative transition-all duration-200 shadow-sm ${isAdmin ? 'bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}
                              style={{
                                padding: '10px 14px',
                                borderRadius: isAdmin
                                  ? (isFirstInGroup && isLastInGroup ? '20px 20px 4px 20px' :
                                    isFirstInGroup ? '20px 20px 4px 20px' :
                                      isLastInGroup ? '20px 4px 20px 20px' : '20px 4px 4px 20px')
                                  : (isFirstInGroup && isLastInGroup ? '20px 20px 20px 4px' :
                                    isFirstInGroup ? '20px 20px 20px 4px' :
                                      isLastInGroup ? '4px 20px 20px 20px' : '4px 20px 20px 4px'),
                              }}
                            >
                              <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                          )}

                          {/* Time and Read Status below message */}
                          {isLastInGroup && (
                            <div className={`mt-1 flex items-center gap-1 px-1 transition-opacity duration-300 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] font-medium text-[var(--text-tertiary)]/70">
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isAdmin && message.isRead && (
                                <span className="text-[10px] font-bold text-[var(--accent-blue)]">Đã xem</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {isTyping && (
                <div className="flex items-end gap-2.5 mb-4 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    {selectedTenant?.fullName.charAt(0).toUpperCase()}
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

                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-[50px] h-[50px] rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-blue)] transition-all shadow-sm hover:scale-105 active:scale-95"
                      title="Emoji"
                    >
                      <Smile size={22} fill="currentColor" fillOpacity={0.1} />
                    </button>

                    {showEmojiPicker && (
                      <div
                        ref={emojiPickerRef}
                        className="absolute bottom-16 left-0 p-3 bg-[var(--bg-primary)] rounded-2xl shadow-2xl border border-[var(--border-primary)] grid grid-cols-4 gap-2 z-[60] animate-scaleIn min-w-[180px]"
                      >
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => insertEmoji(emoji)}
                            className="text-2xl hover:bg-[var(--bg-tertiary)] p-2 rounded-xl transition-all active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 h-[50px] relative bg-[var(--bg-tertiary)] rounded-[24px] overflow-hidden border border-transparent focus-within:border-[var(--accent-blue)]/30 focus-within:ring-4 focus-within:ring-[var(--accent-blue)]/5 transition-all flex items-center">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onPaste={handlePaste}
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fadeIn p-8 text-center bg-[var(--bg-secondary)]">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center mb-8 shadow-2xl relative">
              <div className="absolute inset-2 border-4 border-white/20 rounded-full animate-spin-slow"></div>
              <MessageSquare size={80} className="text-white drop-shadow-lg" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3 tracking-tight">Chào mừng đến với EZ Home Chat!</h2>
            <p className="text-[var(--text-secondary)] max-w-sm font-medium leading-relaxed">
              Chọn một cư dân từ danh sách bên trái để bắt đầu hỗ trợ và quản lý căn hộ của họ.
            </p>
            <div className="mt-8 flex gap-4">
              <div className="py-2 px-4 rounded-full bg-[var(--bg-tertiary)] text-[11px] font-bold text-[var(--text-tertiary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Trực tuyến
              </div>
              <div className="py-2 px-4 rounded-full bg-[var(--bg-tertiary)] text-[11px] font-bold text-[var(--text-tertiary)] flex items-center gap-2">
                ⚡ Phản hồi nhanh
              </div>
            </div>
          </div>
        )}

        {/* Modal-like Viewing Image */}
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
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-scaleIn"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
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
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3 text-center tracking-tight">Xóa trò chuyện?</h2>
              <p className="text-[var(--text-secondary)] mb-8 text-center text-[14px]">
                Tất cả nội dung của cuộc trò chuyện này sẽ được dọn sạch. Bạn không thể hoàn tác hành động này.
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
                  Giữ lại cuộc trò chuyện
                </button>
              </div>
            </div>
          </div>
        )
      }

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
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .safe-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div >
  )
}
