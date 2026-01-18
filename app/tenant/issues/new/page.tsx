'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, Upload, XCircle } from 'lucide-react'

export default function NewIssuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    category: '',
    images: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/tenant/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/tenant/issues')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error creating issue:', error)
      alert('Có lỗi xảy ra khi gửi báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('File must be an image')
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5MB')
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/issues/upload', {
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
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }))
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi tải ảnh lên')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gửi báo cáo sự cố mới</h1>
          <p className="text-secondary mt-1">Mô tả chi tiết sự cố bạn gặp phải</p>
        </div>
        <Link
          href="/tenant/issues"
          className="btn btn-secondary btn-md"
        >
          <X size={18} />
          <span>Hủy</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Tiêu đề sự cố <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="VD: Hỏng điều hòa phòng ngủ"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Loại sự cố
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input w-full"
          >
            <option value="">Chọn loại sự cố</option>
            <option value="Điện & Máy lạnh">Điện & Máy lạnh</option>
            <option value="Điện dân dụng">Điện dân dụng</option>
            <option value="Nước & Vệ sinh">Nước & Vệ sinh</option>
            <option value="Dịch vụ mạng">Dịch vụ mạng</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Mức độ nghiêm trọng
          </label>
          <select
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            className="input w-full"
          >
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Mô tả chi tiết về sự cố bạn gặp phải..."
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Hình ảnh (nếu có)
          </label>
          <div className="space-y-3">
            <label className="block border-2 border-dashed border-primary rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              <Upload className={`mx-auto mb-2 ${uploading ? 'text-gray-400' : 'text-gray-400'}`} size={32} />
              <p className="text-sm font-medium text-primary">
                {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
              </p>
              <p className="text-xs text-tertiary mt-1">PNG, JPG tối đa 5MB mỗi ảnh</p>
            </label>
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary">
          <Link
            href="/tenant/issues"
            className="btn btn-secondary btn-md"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-md"
          >
            <Save size={18} />
            <span>{loading ? 'Đang gửi...' : 'Gửi báo cáo'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
