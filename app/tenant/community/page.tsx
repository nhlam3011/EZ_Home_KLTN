'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Search, Image as ImageIcon, ThumbsUp, MessageCircle,
  Share2, X, AlertCircle, CheckCircle, FileText,
  Users, Clock, Send, Filter, Plus, ChevronRight,
  Megaphone, MessageSquare, Heart, Bookmark
} from 'lucide-react'
import Loading, { LoadingSpinner } from '@/components/Loading'

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
  { id: 'ALL', label: 'Tất cả', icon: Users, color: 'blue' },
  { id: 'ANNOUNCEMENT', label: 'Thông báo', icon: Megaphone, color: 'orange' },
  { id: 'DISCUSSION', label: 'Thảo luận', icon: MessageSquare, color: 'purple' },
  { id: 'FEEDBACK', label: 'Góp ý', icon: Heart, color: 'red' },
  { id: 'MARKET', label: 'Mua bán', icon: Bookmark, color: 'green' },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [postLikes, setPostLikes] = useState<Record<number, number>>({})
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<'ANNOUNCEMENT' | 'DISCUSSION' | 'FEEDBACK' | 'MARKET'>('DISCUSSION')
  const [posting, setPosting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'community' | 'myposts'>('community')
  const [showCreateModal, setShowCreateModal] = useState(false)

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

      // Separate pinned posts (admins usually start with pins)
      const pinned = data.filter((post: Post) => post.content.startsWith('📌'))
      const regular = data.filter((post: Post) => !post.content.startsWith('📌'))

      setPosts([...pinned, ...regular])

      const likesMap: Record<number, number> = {}
      data.forEach((post: Post) => {
        likesMap[post.id] = post.likes || 0
      })
      setPostLikes(likesMap)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
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

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    if (minutes > 0) return `${minutes} phút trước`
    return 'Vừa xong'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'ANNOUNCEMENT': return { bg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', label: 'Thông báo' }
      case 'FEEDBACK': return { bg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'Góp ý' }
      case 'MARKET': return { bg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', label: 'Mua bán' }
      default: return { bg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', label: 'Thảo luận' }
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 sm:pb-10 px-4">
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-right duration-300">
          <div className="bg-white dark:bg-slate-800 border-l-4 border-green-500 shadow-xl rounded-lg px-6 py-4 flex items-center gap-3">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md pt-4 -mx-4 px-4 pb-2 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Cộng đồng</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Không gian chung cho mọi cư dân</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="hidden sm:flex btn btn-primary items-center gap-2 px-5"
          >
            <Plus size={18} />
            Đăng bài
          </button>
        </div>

        <div className="flex items-center gap-6 border-b border-primary/50">
          <button
            onClick={() => setActiveTab('community')}
            className={`pb-3 text-sm font-semibold transition-all relative ${activeTab === 'community'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Bảng tin
            {activeTab === 'community' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('myposts')}
            className={`pb-3 text-sm font-semibold transition-all relative ${activeTab === 'myposts'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Bài viết của tôi
            {activeTab === 'myposts' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'community' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm nội dung, người đăng..."
                className="input pl-12 bg-white dark:bg-slate-900 border-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${activeCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <cat.icon size={16} />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner size={40} className="text-blue-500 mb-4" />
              <p className="text-slate-500 text-sm animate-pulse">Đang tải tin mới...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {posts.length === 0 ? (
                <div className="card text-center py-16 bg-white dark:bg-slate-800/50">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Không tìm thấy bài viết</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm khác nhé.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const initials = getInitials(post.user.fullName)
                  const theme = getCategoryTheme(post.category)
                  const isPinned = post.content.startsWith('📌')

                  return (
                    <div key={post.id} className="card-glass border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 overflow-hidden group">
                      {isPinned && (
                        <div className="bg-orange-500 h-1 w-full" />
                      )}

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden">
                                {post.user.avatarUrl ? (
                                  <img src={post.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{initials}</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-none">{post.user.fullName}</h3>
                                {post.user.contracts?.[0]?.room?.name && (
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                    {post.user.contracts[0].room.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                <Clock size={12} />
                                <span>{formatRelativeTime(post.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${theme.bg}`}>
                            {theme.label}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
                          {isPinned ? post.content.replace(/^📌\s*/, '') : post.content}
                        </p>

                        {post.images && post.images.length > 0 && (
                          <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                            }`}>
                            {post.images.slice(0, 4).map((img, idx) => (
                              <div key={idx} className={`relative group/img overflow-hidden bg-slate-100 dark:bg-slate-700 ${post.images.length === 3 && idx === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'
                                }`}>
                                <img
                                  src={img}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110 cursor-zoom-in"
                                  alt=""
                                />
                                {idx === 3 && post.images.length > 4 && (
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">+{post.images.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-1">
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-all font-medium text-xs">
                              <ThumbsUp size={16} />
                              <span>{postLikes[post.id] || 0}</span>
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all font-medium text-xs">
                              <MessageCircle size={16} />
                              <span>{post.comments || 0}</span>
                            </button>
                          </div>
                          <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'myposts' && (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="card text-center py-20">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-blue-500" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Bắt đầu câu chuyện</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-6">Bạn chưa đăng bài viết nào. Hãy chia sẻ bất cứ điều gì với hàng xóm nhé.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Đăng bài ngay
              </button>
            </div>
          ) : (
            myPosts.map((post) => {
              const theme = getCategoryTheme(post.category)
              return (
                <div key={post.id} className="card-glass border-none bg-white dark:bg-slate-800 p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${theme.bg}`}>
                      <Filter size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{theme.label}</span>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.status === 'PUBLIC'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                            : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                          }`}>
                          {post.status === 'PUBLIC' ? 'Đã duyệt' : 'Đang chờ'}
                        </div>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={10} /> {formatRelativeTime(post.createdAt)}</span>
                        <span>•</span>
                        <span>{post.likes || 0} thích</span>
                        <span>•</span>
                        <span>{post.comments || 0} bình luận</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 sm:hidden w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 animate-bounce group"
      >
        <Plus size={28} className="transition-transform group-hover:rotate-90" />
      </button>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between p-4 border-b border-primary">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Đăng bài viết mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {CATEGORIES.slice(1).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setNewPostCategory(cat.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${newPostCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    <cat.icon size={14} />
                    <span className="text-xs font-bold">{cat.label}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Hàng xóm ơi, hôm nay có chuyện gì vui thế?"
                className="w-full min-h-[150px] p-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl text-[15px] focus:ring-0 resize-none text-slate-800 dark:text-slate-200"
              />

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {selectedImages.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-blue-600 hover:text-blue-700 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-sm font-bold">Thêm ảnh</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                </label>

                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || posting || uploadingImages}
                  className="btn btn-primary px-8 rounded-xl h-12 flex items-center gap-2"
                >
                  {posting ? <LoadingSpinner size={16} /> : <Send size={18} />}
                  <span>{posting ? 'Đang đăng...' : 'Đăng ngay'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
