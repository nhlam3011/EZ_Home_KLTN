'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Image as ImageIcon, XCircle } from 'lucide-react'

interface Issue {
  id: number
  title: string
  description: string
  status: string
  images: string[]
  createdAt: Date
  repairCost: number | null
  room: {
    name: string
  }
  category?: string
  severity?: string
  progress?: number
}

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchIssue()
    }
  }, [params.id])

  const fetchIssue = async () => {
    try {
      const response = await fetch(`/api/tenant/issues/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setIssue(data)
      } else {
        const error = await response.json()
        alert(error.error || 'Không tìm thấy sự cố')
        router.push('/tenant/issues')
      }
    } catch (error) {
      console.error('Error fetching issue:', error)
      alert('Có lỗi xảy ra khi tải thông tin sự cố')
    } finally {
      setLoading(false)
    }
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700' },
      PROCESSING: { label: 'Đang sửa chữa', className: 'bg-blue-100 text-blue-700' },
      DONE: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-700' }
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  }

  const getSeverityBadge = (severity: string) => {
    const severityMap: Record<string, { label: string; className: string }> = {
      HIGH: { label: 'Cao', className: 'bg-red-100 text-red-700' },
      MEDIUM: { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-700' },
      LOW: { label: 'Thấp', className: 'bg-blue-100 text-blue-700' }
    }
    return severityMap[severity] || { label: severity, className: 'bg-gray-100 text-gray-700' }
  }

  const handleRate = async () => {
    if (!issue) return
    const rating = prompt('Vui lòng đánh giá chất lượng dịch vụ sửa chữa (1-5 sao):')
    if (rating && parseInt(rating) >= 1 && parseInt(rating) <= 5) {
      try {
        const response = await fetch(`/api/tenant/issues/${issue.id}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: parseInt(rating) })
        })
        if (response.ok) {
          alert('Cảm ơn bạn đã đánh giá!')
        } else {
          alert('Có lỗi xảy ra khi gửi đánh giá')
        }
      } catch (error) {
        console.error('Error rating issue:', error)
        alert('Cảm ơn bạn đã đánh giá!')
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    )
  }

  if (!issue) {
    return null
  }

  const statusBadge = getStatusBadge(issue.status)
  const severityBadge = issue.severity ? getSeverityBadge(issue.severity) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/tenant/issues"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
            <p className="text-gray-600 mt-1">Phòng {issue.room.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {severityBadge && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityBadge.className}`}>
              {severityBadge.label}
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mô tả sự cố</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {issue.description.split('\n\n--- Admin Notes ---')[0]}
            </p>
            {issue.description.includes('--- Admin Notes ---') && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghi chú của Admin:</h3>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                  {issue.description.split('--- Admin Notes ---\n')[1]}
                </p>
              </div>
            )}
          </div>

          {/* Images */}
          {issue.images && issue.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon size={20} />
                Hình ảnh hiện trạng
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {issue.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Issue image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {issue.progress !== undefined && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiến độ xử lý</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Hoàn thành</span>
                  <span className="font-semibold text-gray-900">{issue.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      issue.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${issue.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Thông tin</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Ngày gửi</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(issue.createdAt)}</p>
              </div>
              {issue.category && (
                <div>
                  <p className="text-xs text-gray-500">Loại sự cố</p>
                  <p className="text-sm font-medium text-gray-900">{issue.category}</p>
                </div>
              )}
              {issue.repairCost && (
                <div>
                  <p className="text-xs text-gray-500">Chi phí sửa chữa</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(issue.repairCost)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {issue.status === 'DONE' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Đánh giá</h3>
              <button
                onClick={handleRate}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Star size={18} />
                <span>Đánh giá dịch vụ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <XCircle size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
