'use client'

import { useEffect, useState } from 'react'
import { Image as ImageIcon, MessageCircle, Share2, ThumbsUp, XCircle, Bell, Phone, Shield } from 'lucide-react'

interface Post {
  id: number
  content: string
  images: string[]
  status: string
  createdAt: Date
  user: {
    fullName: string
    avatarUrl?: string
  }
  likes?: number
  comments?: number
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [newPost, setNewPost] = useState('')
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [postLikes, setPostLikes] = useState<Record<number, number>>({})
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    fetchPosts()
    fetchPinnedPosts()
  }, [filter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('type', filter)

      const response = await fetch(`/api/tenant/posts?${params.toString()}`)
      const data = await response.json()
      const nonPinnedPosts = data.filter((post: Post) => !post.content.startsWith('📌'))
      setPosts(nonPinnedPosts)
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

  const fetchPinnedPosts = async () => {
    try {
      const response = await fetch('/api/tenant/posts')
      const data = await response.json()
      const pinned = data
        .filter((post: Post) => post.content.startsWith('📌'))
        .slice(0, 3)
      setPinnedPosts(pinned)
    } catch (error) {
      console.error('Error fetching pinned posts:', error)
    }
  }

  const handlePost = async () => {
    if (!newPost.trim()) return

    try {
      const response = await fetch('/api/tenant/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPost,
          images: selectedImages
        })
      })

      if (response.ok) {
        setNewPost('')
        setSelectedImages([])
        fetchPosts()
        fetchPinnedPosts()
      }
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} không phải là ảnh`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn (tối đa 5MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/posts/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newImages.push(data.url)
        } else {
          const error = await response.json()
          alert(`Lỗi upload ${file.name}: ${error.error}`)
        }
      }

      setSelectedImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Có lỗi xảy ra khi upload ảnh')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    return 'Vừa xong'
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleLike = async (postId: number) => {
    const isLiked = likedPosts.has(postId)
    const newLikedPosts = new Set(likedPosts)
    
    if (isLiked) {
      newLikedPosts.delete(postId)
      setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) - 1 }))
    } else {
      newLikedPosts.add(postId)
      setPostLikes(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }))
    }
    
    setLikedPosts(newLikedPosts)
    
    try {
      await fetch(`/api/tenant/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST'
      })
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleComment = (postId: number) => {
    const comment = prompt('Nhập bình luận của bạn:')
    if (comment && comment.trim()) {
      alert('Bình luận đã được gửi!')
    }
  }

  const handleShare = async (postId: number) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Bài viết từ EZ-Home',
          text: 'Xem bài viết này trên EZ-Home',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Đã sao chép liên kết vào clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleSupportRequest = () => {
    const issue = prompt('Mô tả vấn đề bạn cần hỗ trợ:')
    if (issue && issue.trim()) {
      alert('Yêu cầu hỗ trợ của bạn đã được gửi. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.')
    }
  }

  const handleViewAllNotices = () => {
    setFilter('notice')
  }

  const filterOptions = [
    { value: 'all', label: 'Tất cả tin', icon: null },
    { value: 'notice', label: 'BQL', icon: null, badge: true },
    { value: 'classified', label: 'Rao vặt', icon: null },
    { value: 'roommate', label: 'Tìm người ở ghép', icon: null }
  ]

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Header */}
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-primary">Cộng đồng</h1>
              <p className="text-secondary mt-1">Kết nối và chia sẻ với cộng đồng</p>
            </div>

            {/* Filter */}
            <div className="card p-3 lg:p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Bộ lọc tin</h3>
              <div className="flex items-center gap-4 lg:gap-6 flex-wrap">
                {filterOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer h-5"
                  >
                    <input
                      type="radio"
                      name="filter"
                      value={option.value}
                      checked={filter === option.value}
                      onChange={(e) => setFilter(e.target.value)}
                      className="text-blue-600 w-4 h-4 m-0 p-0 flex-shrink-0 align-middle"
                    />
                    {option.icon && (
                      <span className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                        {option.icon}
                      </span>
                    )}
                    <span className="text-sm text-primary whitespace-nowrap leading-5">{option.label}</span>
                    {option.badge && (
                      <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Post Creation */}
            <div className="card p-3 lg:p-4">
              <div className="flex items-start gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs lg:text-sm flex-shrink-0">
                  T
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Bạn muốn bán gì hôm nay, Nguyễn Văn A?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="input w-full px-3 lg:px-4 py-2 text-sm lg:text-base"
                  />
                  
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                      {selectedImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 sm:h-24 object-cover rounded-lg border border-primary"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <label className="text-xs sm:text-sm text-secondary hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer">
                      <ImageIcon size={16} className="flex-shrink-0 w-4 h-4" />
                      <span className="hidden sm:inline leading-4">Thêm ảnh</span>
                      <span className="sm:hidden leading-4">Ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        disabled={uploadingImages}
                        className="hidden"
                      />
                    </label>
                    {uploadingImages && (
                      <span className="text-xs text-secondary leading-none">Đang upload...</span>
                    )}
                    <button
                      onClick={handlePost}
                      disabled={uploadingImages || !newPost.trim()}
                      className="btn btn-primary btn-sm text-xs sm:text-sm px-3 sm:px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Đăng bài
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-tertiary">Đang tải...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-tertiary">Chưa có bài viết nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="card p-3 lg:p-4">
                    <div className="flex items-start gap-2 lg:gap-3 mb-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs lg:text-sm flex-shrink-0">
                        {getInitials(post.user.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-primary text-sm lg:text-base truncate">{post.user.fullName}</span>
                          {post.status === 'PUBLIC' && filter === 'notice' && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium whitespace-nowrap">
                              Thông báo
                            </span>
                          )}
                          {filter === 'classified' && (
                            <span className="badge badge-success rounded text-xs whitespace-nowrap">
                              Rao bán
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-tertiary">{formatRelativeTime(post.createdAt)}</p>
                      </div>
                    </div>
                    
                    <p className="text-primary mb-3 whitespace-pre-wrap text-sm lg:text-base break-words">{post.content}</p>
                    
                    {post.images && post.images.length > 0 && (
                      <div className="mb-4">
                        {post.images.length === 1 ? (
                          <img
                            src={post.images[0]}
                            alt="Post"
                            className="w-full rounded-xl object-cover max-h-96"
                          />
                        ) : (
                          <div className={`grid gap-2 ${post.images.length === 2 ? 'grid-cols-2' : post.images.length === 3 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {post.images.slice(0, 6).map((img, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                                <img
                                  src={img}
                                  alt={`Post ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 5 && post.images.length > 6 && (
                                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">+{post.images.length - 6}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 sm:gap-4 pt-3 border-t border-primary flex-wrap">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 sm:gap-2 transition-colors ${
                          likedPosts.has(post.id)
                            ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500'
                            : 'text-secondary hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <ThumbsUp size={16} className={`sm:w-[18px] sm:h-[18px] ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        <span className="text-xs sm:text-sm whitespace-nowrap">{postLikes[post.id] || post.likes || 0} lượt thích</span>
                      </button>
                      <button 
                        onClick={() => handleComment(post.id)}
                        className="flex items-center gap-1 sm:gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="text-xs sm:text-sm whitespace-nowrap">{post.comments || 0} bình luận</span>
                      </button>
                      <button 
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-1 sm:gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="text-xs sm:text-sm whitespace-nowrap">Chia sẻ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* Pinned Notices */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-lg shadow-sm p-4 lg:p-6 text-white">
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <span className="text-lg lg:text-xl">📌</span>
                <h3 className="text-base lg:text-lg font-semibold">Thông báo Ghim</h3>
              </div>
              {pinnedPosts.length > 0 ? (
                <div className="space-y-2 lg:space-y-3">
                  {pinnedPosts.map((post, index) => (
                    <div 
                      key={post.id} 
                      className={index < pinnedPosts.length - 1 ? "pb-2 lg:pb-3 border-b border-white/20" : ""}
                    >
                      <p className="text-xs text-white/70 mb-1">{formatDate(post.createdAt)}</p>
                      <p className="text-xs lg:text-sm break-words leading-relaxed">{post.content.replace(/^📌\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs lg:text-sm text-white/70">Chưa có thông báo ghim</p>
                </div>
              )}
              <button 
                onClick={handleViewAllNotices}
                className="mt-3 lg:mt-4 text-xs lg:text-sm text-blue-200 hover:text-blue-100 transition-colors"
              >
                Xem tất cả →
              </button>
            </div>

            {/* Support */}
            <div className="card p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-primary mb-2">Cần hỗ trợ?</h3>
              <p className="text-xs lg:text-sm text-secondary mb-3 lg:mb-4">
                Ban quản lý luôn sẵn sàng hỗ trợ bạn 24/7
              </p>
              <div className="space-y-2 lg:space-y-3 mb-3 lg:mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base lg:text-lg flex-shrink-0">📞</span>
                  <div className="min-w-0">
                    <p className="text-xs text-tertiary">Hotline Kỹ thuật</p>
                    <p className="text-sm font-semibold text-primary">1900 1234</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base lg:text-lg flex-shrink-0">🛡️</span>
                  <div className="min-w-0">
                    <p className="text-xs text-tertiary">An ninh (24/7)</p>
                    <p className="text-sm font-semibold text-primary">0909 888 999</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSupportRequest}
                className="btn btn-primary btn-sm lg:btn-md w-full text-xs lg:text-sm"
              >
                Gửi yêu cầu hỗ trợ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
