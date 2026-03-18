'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Search, Image as ImageIcon, CheckCircle, FileText,
  Users, Clock, Plus, ChevronDown,
  Megaphone, MessageSquare, Heart, Bookmark,
  User, X, Send, Loader2, MessageSquareOff, Smile
} from 'lucide-react'
import Loading from '@/components/Loading'
import CommunityPostCard from '@/components/CommunityPostCard'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { useDarkMode } from '../../contexts/DarkModeContext'

interface Post {
  id: number
  content: string
  images: string[]
  category: 'ANNOUNCEMENT' | 'DISCUSSION' | 'FEEDBACK' | 'MARKET'
  status: string
  createdAt: Date
  userId?: number
  user: {
    fullName: string
    avatarUrl?: string
    contracts?: { room: { name: string } }[]
  }
  likes?: number
  comments?: number
}

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả', icon: Users, bg: 'bg-blue-600 dark:bg-blue-500', text: 'text-blue-600' },
  { id: 'ANNOUNCEMENT', label: 'Thông báo', icon: Megaphone, bg: 'bg-amber-500 dark:bg-amber-600', text: 'text-amber-600' },
  { id: 'DISCUSSION', label: 'Thảo luận', icon: MessageSquare, bg: 'bg-sky-500 dark:bg-sky-600', text: 'text-sky-600' },
  { id: 'FEEDBACK', label: 'Góp ý', icon: Heart, bg: 'bg-rose-500 dark:bg-rose-600', text: 'text-rose-600' },
  { id: 'MARKET', label: 'Mua bán', icon: Bookmark, bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-emerald-600' },
]

export default function CommunityPage() {
  const { isDark } = useDarkMode()
  const [posts, setPosts] = useState<Post[]>([])
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<'ANNOUNCEMENT' | 'DISCUSSION' | 'FEEDBACK' | 'MARKET'>('DISCUSSION')
  const [posting, setPosting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'community' | 'myposts'>('community')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const onEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const text = newPostContent
      const before = text.substring(0, start)
      const after = text.substring(end)
      setNewPostContent(before + emoji + after)

      // Reset cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length)
        }
      }, 0)
    } else {
      setNewPostContent(prev => prev + emoji)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchMyPosts()
  }, [searchQuery, activeCategory])

  const showAlert = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 3000)
  }

  const fetchMyPosts = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return
      const user = JSON.parse(userData)
      const response = await fetch(`/api/tenant/posts?userId=${user.id}&status=all`)
      const data = await response.json()
      setMyPosts(data)
    } catch (error) {
      console.error('Error fetching my posts:', error)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (activeCategory !== 'ALL') params.append('category', activeCategory)

      const response = await fetch(`/api/tenant/posts?${params.toString()}`)
      const data = await response.json()

      const pinned = data.filter((post: Post) => post.content.startsWith('📌'))
      const regular = data.filter((post: Post) => !post.content.startsWith('📌'))

      setPosts([...pinned, ...regular])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            setSelectedImages(prev => [...prev, base64].slice(0, 5))
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert('Vui lòng nhập nội dung bài viết')
      return
    }

    setPosting(true)
    try {
      const userData = localStorage.getItem('user')
      if (!userData) return
      const user = JSON.parse(userData)

      const response = await fetch('/api/tenant/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          images: selectedImages,
          category: newPostCategory,
          userId: user.id
        })
      })

      if (response.ok) {
        showAlert('Đã đăng bài thành công! Bài viết đang chờ duyệt.')
        setNewPostContent('')
        setSelectedImages([])
        setShowCreateModal(false)
        fetchPosts()
        fetchMyPosts()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setPosting(false)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])

        const response = await fetch('/api/posts/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newImages.push(data.url)
        }
      }
      setSelectedImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setUploadingImages(false)
    }
  }

  const displayPosts = activeTab === 'community' ? posts : myPosts

  return (
    <div className="pb-12 px-4 min-h-screen space-y-8">

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
          <div className="bg-primary dark:bg-tertiary backdrop-blur-xl border border-green-500/20 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 border-primary">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="text-green-500" size={18} />
            </div>
            <p className="text-sm font-bold text-primary">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-wider">CỘNG ĐỒNG</h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">Kết nối và chia sẻ cùng cư dân</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex btn btn-primary h-11 px-6 rounded-2xl items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="font-bold">Đăng bài</span>
        </button>
      </div>

      {/* Navigation Tabs - Centered on mobile/tablet */}
      <div className="border-b border-primary mb-8 relative z-30 overflow-hidden">
        <div className="flex items-center justify-center lg:justify-start gap-4 lg:gap-8 overflow-x-auto no-scrollbar px-4 lg:px-0">
          <button
            onClick={() => setActiveTab('community')}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'community'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <Megaphone size={18} />
            <span>Bảng tin</span>
          </button>
          <button
            onClick={() => setActiveTab('myposts')}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'myposts'
              ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <User size={18} />
            <span>Bài của tôi</span>
          </button>
        </div>
      </div>

      {/* Filters & Search - Single row layout like admin */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full mb-8">
        <div className="relative group flex-1 lg:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-[var(--accent-blue)] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-with-icon w-full h-11 bg-white dark:bg-gray-800 rounded-2xl border-primary focus:ring-2 focus:ring-blue-500/20 transition-all text-primary placeholder:text-tertiary text-sm font-medium outline-none"
          />
        </div>

        <div className="flex items-center justify-center lg:justify-start gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2.5 px-5 h-11 rounded-2xl whitespace-nowrap text-[11px] font-bold transition-all border-none shadow-sm active:scale-95 ${isSelected
                  ? `${cat.bg} text-white shadow-lg shadow-blue-500/20`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                <Icon size={16} className={isSelected ? 'text-white' : cat.text || 'text-slate-500'} />
                <span className="uppercase tracking-wider">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Posts List - Single Column */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mb-4" size={32} />
          <p className="text-tertiary text-sm">Đang tải...</p>
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="py-20 text-center bg-tertiary/20 rounded-3xl border-2 border-dashed border-primary">
          <MessageSquareOff className="w-16 h-16 text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-primary">Chưa có bài viết</h3>
          <p className="text-tertiary text-sm mt-2">Hãy là người đầu tiên chia sẻ!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayPosts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              showCategory="text"
              variant="tenant"
            />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-primary dark:bg-tertiary w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col border-t sm:border border-primary animate-slideUp sm:animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-primary">
              <h2 className="text-xl font-bold text-primary tracking-tight">Tạo bài viết mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-tertiary text-secondary rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 no-scrollbar">
              {/* Category Selection */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest px-1">Chọn thể loại</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1">
                  {CATEGORIES.slice(1).map((cat) => {
                    const Icon = cat.icon
                    const isSelected = newPostCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setNewPostCategory(cat.id as any)}
                        className={`flex items-center gap-2.5 h-11 px-5 rounded-2xl whitespace-nowrap text-[11px] font-bold transition-all border-none ${isSelected
                          ? `${cat.bg} text-white shadow-lg shadow-blue-500/20`
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        <Icon size={14} className={isSelected ? 'text-white' : cat.text || 'text-slate-500'} />
                        <span className="uppercase tracking-wider">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest">Nội dung</p>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-[var(--accent-blue)]"
                  >
                    <Smile size={18} />
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Chia sẻ điều gì đó với hàng xóm..."
                  rows={8}
                  className="w-full resize-none p-5 rounded-[1.5rem] bg-tertiary border-2 border-transparent focus:border-[var(--accent-blue)] transition-all text-sm text-primary placeholder:text-tertiary shadow-inner font-medium leading-relaxed"
                />
              </div>

              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest px-1">Hình ảnh ({selectedImages.length})</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-tertiary group">
                        <img src={img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <button
                          onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur-md rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-primary bg-tertiary/20">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[var(--accent-blue)] group-hover:scale-110 transition-transform shadow-sm">
                    <ImageIcon size={22} />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                  {uploadingImages && <Loader2 size={18} className="animate-spin text-[var(--accent-blue)] ml-2" />}
                </label>

                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || posting}
                  className="btn btn-primary h-12 px-8 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm"
                >
                  {posting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="font-bold">Đang đăng...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="font-bold uppercase tracking-tight">Đăng bài</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Emoji Picker - outside scrollable area */}
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-[110]" onClick={() => setShowEmojiPicker(false)} />
                {/* Desktop */}
                <div className="hidden sm:block absolute top-[140px] right-6 z-[120] animate-scaleIn shadow-2xl rounded-3xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                    theme={isDark ? Theme.DARK : Theme.LIGHT}
                    width={350}
                    height={420}
                    searchPlaceholder="Tìm kiếm emoji..."
                  />
                </div>
                {/* Mobile: bottom sheet */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[120] animate-slideUp rounded-t-3xl overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                    theme={isDark ? Theme.DARK : Theme.LIGHT}
                    width="100%"
                    height={350}
                    searchPlaceholder="Tìm kiếm emoji..."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
