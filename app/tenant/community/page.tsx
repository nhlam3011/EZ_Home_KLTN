'use client'

import { useEffect, useState } from 'react'
import { Image as ImageIcon, Send, Heart, MessageCircle, Share2, ThumbsUp } from 'lucide-react'

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
  const [filter, setFilter] = useState('all')
  const [newPost, setNewPost] = useState('')
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const [postLikes, setPostLikes] = useState<Record<number, number>>({})

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('type', filter)

      const response = await fetch(`/api/tenant/posts?${params.toString()}`)
      const data = await response.json()
      setPosts(data)
      // Initialize likes state
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

  const handlePost = async () => {
    if (!newPost.trim()) return

    try {
      const response = await fetch('/api/tenant/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newPost,
          images: []
        })
      })

      if (response.ok) {
        setNewPost('')
        fetchPosts()
      }
    } catch (error) {
      console.error('Error creating post:', error)
    }
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
      // In a real app, this would send to API
      setPostLikes(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0)
      }))
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
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Đã sao chép liên kết vào clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleAddImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        alert(`Đã chọn ${files.length} ảnh. (Tính năng upload ảnh sẽ được triển khai sau)`)
      }
    }
    input.click()
  }

  const handleSupportRequest = () => {
    const issue = prompt('Mô tả vấn đề bạn cần hỗ trợ:')
    if (issue && issue.trim()) {
      // In a real app, this would send to API
      alert('Yêu cầu hỗ trợ của bạn đã được gửi. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.')
    }
  }

  const handleViewAllNotices = () => {
    setFilter('notice')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Bộ lọc tin</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filter"
                value="all"
                checked={filter === 'all'}
                onChange={(e) => setFilter(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">Tất cả tin</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filter"
                value="notice"
                checked={filter === 'notice'}
                onChange={(e) => setFilter(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">Thông báo BQL</span>
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filter"
                value="classified"
                checked={filter === 'classified'}
                onChange={(e) => setFilter(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">Rao vặt</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="filter"
                value="roommate"
                checked={filter === 'roommate'}
                onChange={(e) => setFilter(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">Tìm người ở ghép</span>
            </label>
          </div>
        </div>

        {/* Post Creation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              T
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Bạn muốn bán gì hôm nay, Nguyễn Văn A?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between mt-3">
                <button 
                  onClick={handleAddImage}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
                >
                  <ImageIcon size={16} />
                  <span>Thêm ảnh</span>
                </button>
                <button
                  onClick={handlePost}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
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
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {getInitials(post.user.fullName)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{post.user.fullName}</span>
                      {post.status === 'PUBLIC' && filter === 'notice' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Thông báo
                        </span>
                      )}
                      {filter === 'classified' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Rao bán
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{formatRelativeTime(post.createdAt)}</p>
                  </div>
                </div>
                <p className="text-gray-900 mb-3 whitespace-pre-wrap">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="mb-3">
                    <img
                      src={post.images[0]}
                      alt="Post"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      likedPosts.has(post.id)
                        ? 'text-blue-600 hover:text-blue-700'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <ThumbsUp size={18} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                    <span className="text-sm">{postLikes[post.id] || post.likes || 0} lượt thích</span>
                  </button>
                  <button 
                    onClick={() => handleComment(post.id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle size={18} />
                    <span className="text-sm">{post.comments || 0} bình luận</span>
                  </button>
                  <button 
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Share2 size={18} />
                    <span className="text-sm">Chia sẻ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Pinned Notices */}
        <div className="bg-[#1e3a5f] rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📌</span>
            <h3 className="text-lg font-semibold">Thông báo Ghim</h3>
          </div>
          <div className="space-y-3">
            <div className="pb-3 border-b border-[#2a4a6f]">
              <p className="text-xs text-gray-300 mb-1">20/10/2023</p>
              <p className="text-sm">Quy định mới về việc đăng ký thẻ cư dân và thẻ xe</p>
            </div>
            <div className="pb-3 border-b border-[#2a4a6f]">
              <p className="text-xs text-gray-300 mb-1">18/10/2023</p>
              <p className="text-sm">Lịch phun thuốc diệt côn trùng định kỳ tháng 10</p>
            </div>
            <div>
              <p className="text-xs text-gray-300 mb-1">15/10/2023</p>
              <p className="text-sm">Thông báo về việc thanh toán phí quản lý tháng 10</p>
            </div>
          </div>
          <button 
            onClick={handleViewAllNotices}
            className="mt-4 text-sm text-blue-300 hover:text-blue-200 transition-colors"
          >
            Xem tất cả →
          </button>
        </div>

        {/* Support */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cần hỗ trợ?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Ban quản lý luôn sẵn sàng hỗ trợ bạn 24/7
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📞</span>
              <div>
                <p className="text-xs text-gray-500">Hotline Kỹ thuật</p>
                <p className="text-sm font-semibold text-gray-900">1900 1234</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <div>
                <p className="text-xs text-gray-500">An ninh (24/7)</p>
                <p className="text-sm font-semibold text-gray-900">0909 888 999</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSupportRequest}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Gửi yêu cầu hỗ trợ
          </button>
        </div>
      </div>
    </div>
  )
}
