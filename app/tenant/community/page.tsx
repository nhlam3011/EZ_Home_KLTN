'use client'

import { useEffect, useState } from 'react'
import { Search, Image as ImageIcon, ThumbsUp, MessageCircle, Share2, X, Sparkles, AlertCircle, CheckCircle, FileText, Users, Clock } from 'lucide-react'
import Loading, { LoadingSpinner } from '@/components/Loading'

interface Post {
  id: number
  content: string
  images: string[]
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

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [myPosts, setMyPosts] = useState<Post[]>([])
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
  const [activeTab, setActiveTab] = useState<'community' | 'myposts'>('community')

  useEffect(() => {
    fetchPosts()
    fetchMyPosts()
  }, [searchQuery])

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
      // Fetch only posts by this user
      const response = await fetch(`/api/tenant/posts?userId=${user.id}&status=all`)
      const data = await response.json()
      // Filter to only show user's own posts (both PENDING and PUBLIC)
      const userPosts = data.filter((post: Post) => post.user.fullName === user.fullName || post.userId === user.id)
      setMyPosts(userPosts)
    } catch (error) {
      console.error('Error fetching my posts:', error)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      // Fetch all posts for community feed
      const response = await fetch(`/api/tenant/posts?${params.toString()}`)
      const data = await response.json()

      // Filter to show only PUBLIC posts (from all users) in community tab
      const communityPosts = data.filter((post: Post) =>
        post.status === 'PUBLIC' && !post.content.startsWith('[Hóa đơn #')
      )

      // Separate pinned posts and regular posts
      const pinned = communityPosts.filter((post: Post) => post.content.startsWith('📌'))
      const regular = communityPosts.filter((post: Post) => !post.content.startsWith('📌'))

      // Sort: pinned first, then by date (newest first)
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

      {/* Tabs */}
      <div className="border-b border-primary">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'community'
              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <Users size={16} />
            Cộng đồng
          </button>
          <button
            onClick={() => setActiveTab('myposts')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 relative ${activeTab === 'myposts'
              ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-secondary hover:text-primary'
              }`}
          >
            <FileText size={16} />
            Bài viết của tôi
            {myPosts.filter(p => p.status !== 'PUBLIC').length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                {myPosts.filter(p => p.status !== 'PUBLIC').length}
              </span>
            )}
          </button>
        </div>
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
                  <LoadingSpinner size={16} className="text-blue-500" />
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
                    <LoadingSpinner size={16} className="text-white" />
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

      {/* Search - only show for community tab */}
      {activeTab === 'community' && (
        <div className="card">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-with-icon w-full pl-8 sm:pl-10 pr-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      {activeTab === 'community' && (
        loading ? (
          <div className="card">
            <Loading size="lg" text="Đang tải..." />
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {filteredPosts.map((post) => {
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
                        {post.user.contracts?.[0]?.room?.name && (
                          <span className="badge badge-ghost text-xs bg-tertiary">
                            {post.user.contracts[0].room.name}
                          </span>
                        )}
                        {isPinnedPost && (
                          <span className="badge badge-warning text-xs">
                            📌
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
                        <div className="relative bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center rounded-xl overflow-hidden w-full max-h-[600px]">
                          <img
                            src={post.images[0]}
                            alt="Post"
                            className="w-full max-h-[600px] object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
                          />
                        </div>
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
                  <div className="flex items-center justify-between pt-4 border-t border-primary">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors justify-center text-sm ${likedPosts.has(post.id)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                          : 'hover:bg-tertiary text-secondary'
                          }`}
                      >
                        <ThumbsUp size={14} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                        <span>{postLikes[post.id] || post.likes || 0} lượt thích</span>
                      </button>
                      <button
                        onClick={() => handleComment(post.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-tertiary text-secondary text-sm justify-center transition-colors"
                      >
                        <MessageCircle size={14} />
                        <span>{post.comments || 0} bình luận</span>
                      </button>
                      <button
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-tertiary text-secondary text-sm font-medium transition-colors"
                      >
                        <Share2 size={16} />
                        <span>Chia sẻ</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredPosts.length === 0 && (
              <div className="card col-span-full">
                <div className="text-center py-12">
                  <p className="text-tertiary">Không có bài viết nào</p>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {activeTab === 'myposts' && (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText size={48} className="mx-auto text-tertiary mb-3" />
              <p className="text-lg font-semibold text-primary mb-2">Bạn chưa có bài viết nào</p>
              <p className="text-tertiary mb-4">Hãy đăng bài viết đầu tiên của bạn!</p>
            </div>
          ) : (
            myPosts.map((post: Post) => {
              const initials = getInitials(post.user.fullName)
              const isPinnedPost = post.content.startsWith('📌')
              return (
                <div key={post.id} className="card p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-primary text-sm">{post.user.fullName}</span>
                        {post.user.contracts?.[0]?.room?.name && (
                          <span className="badge badge-ghost text-xs bg-tertiary">
                            {post.user.contracts[0].room.name}
                          </span>
                        )}
                        <span className={`badge ${post.status === 'PUBLIC' ? 'badge-success' :
                          post.status === 'PENDING' ? 'badge-warning' : 'badge-error'
                          } text-xs`}>
                          {post.status === 'PUBLIC' ? 'Đã duyệt' :
                            post.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                        </span>
                        {isPinnedPost && (
                          <span className="badge badge-warning text-xs">📌</span>
                        )}
                      </div>
                      <p className="text-sm text-primary line-clamp-2 mb-2">
                        {isPinnedPost ? post.content.replace(/^📌\s*/, '') : post.content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-tertiary">
                        <Clock size={12} />
                        <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span>{post.likes || 0} likes</span>
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
    </div>
  )
}
