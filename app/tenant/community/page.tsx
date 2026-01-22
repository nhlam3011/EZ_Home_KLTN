'use client'

import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, ThumbsUp, MessageCircle, Share2, X, Loader2, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [postLikes, setPostLikes] = useState<Record<number, number>>({})
  const [newPostContent, setNewPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [searchQuery])

  const showAlert = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessAlert(true)
    setTimeout(() => setShowSuccessAlert(false), 3000)
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/tenant/posts?${params.toString()}`)
      const data = await response.json()
      
      // Filter out invoice notification posts and only show PUBLIC posts
      const publicPosts = data.filter((post: Post) => 
        post.status === 'PUBLIC' && !post.content.startsWith('[Hóa đơn #')
      )
      
      // Separate pinned posts (starting with 📌) and regular posts
      const pinned = publicPosts.filter((post: Post) => post.content.startsWith('📌'))
      const regular = publicPosts.filter((post: Post) => !post.content.startsWith('📌'))
      
      // Sort: pinned first, then by date
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
      if (!userData) {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
        return
      }

      const user = JSON.parse(userData)
      
      if (user.role !== 'TENANT') {
        alert('Chỉ cư dân mới có thể đăng bài')
        return
      }
      
      const response = await fetch('/api/tenant/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          images: selectedImages,
          userId: user.id
        })
      })

      if (response.ok) {
        showAlert('Đã đăng bài thành công! Bài viết của bạn đang chờ được duyệt.')
        setNewPostContent('')
        setSelectedImages([])
        fetchPosts()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi đăng bài')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Có lỗi xảy ra khi đăng bài')
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

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
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
    
    // Note: Like endpoint may not be implemented yet
    try {
      const response = await fetch(`/api/tenant/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST'
      })
      if (!response.ok) {
        // Silently fail if endpoint doesn't exist
        console.log('Like endpoint not available')
      }
    } catch (error) {
      // Silently fail if endpoint doesn't exist
      console.log('Like endpoint not available')
    }
  }

  const handleComment = (postId: number) => {
    const comment = prompt('Nhập bình luận của bạn:')
    if (comment && comment.trim()) {
      showAlert('Bình luận đã được gửi!')
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
        showAlert('Đã sao chép liên kết vào clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      post.content.toLowerCase().includes(query) ||
      post.user.fullName.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Cộng đồng</h1>
        <p className="text-sm sm:text-base text-secondary mt-1">Kết nối và chia sẻ với cộng đồng</p>
      </div>

      {/* Create Post Form */}
      <div className="card">
        <div className="p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="sm:w-5 sm:h-5" />
            Đăng bài viết
          </h3>
          <div className="space-y-4">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Bạn muốn chia sẻ gì với cộng đồng?"
              rows={4}
              className="input w-full resize-none"
            />
            
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-primary transition-colors">
                <ImageIcon size={18} />
                <span>Thêm ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  disabled={uploadingImages}
                  className="hidden"
                />
              </label>
              
              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {selectedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-primary"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {uploadingImages && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Đang upload ảnh...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-primary">
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || posting || uploadingImages}
                className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {posting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Đang đăng...</span>
                  </>
                ) : (
                  'Đăng bài'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-primary rounded-lg text-xs sm:text-sm bg-primary text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="card">
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2" size={32} />
            <p className="text-tertiary">Đang tải...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts
            .map((post) => {
              const initials = getInitials(post.user.fullName)
              const isPinnedPost = post.content.startsWith('📌')
              return (
                <div key={post.id} className="card p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-semibold">
                        {initials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-primary truncate">{post.user.fullName}</span>
                        {isPinnedPost && (
                          <span className="bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Sparkles size={12} />
                            Thông báo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-tertiary">{formatRelativeTime(post.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-primary mb-4 whitespace-pre-wrap break-words leading-relaxed">
                    {isPinnedPost ? post.content.replace(/^📌\s*/, '') : post.content}
                  </p>
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
                                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
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
                  <div className="flex items-center gap-4 pt-4 border-t border-primary">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(post.id)
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-secondary hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      <ThumbsUp size={18} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                      <span className="text-sm">{postLikes[post.id] || post.likes || 0} lượt thích</span>
                    </button>
                    <button 
                      onClick={() => handleComment(post.id)}
                      className="flex items-center gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-sm">{post.comments || 0} bình luận</span>
                    </button>
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-2 text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Share2 size={18} />
                      <span className="text-sm">Chia sẻ</span>
                    </button>
                  </div>
                </div>
              )
            })}
          {filteredPosts.length === 0 && (
            <div className="card">
              <div className="text-center py-12">
                <p className="text-tertiary">Không có bài viết nào</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
