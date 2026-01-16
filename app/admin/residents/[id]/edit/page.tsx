'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Save, X, Loader2, User, Phone, Mail, CreditCard, Calendar, MapPin, Camera, Upload, Plus, Download, FileText, Image as ImageIcon } from 'lucide-react'

interface Resident {
  id: number
  fullName: string
  phone: string
  email: string | null
  avatarUrl: string | null
  cccdNumber: string | null
  cccdDate: Date | string | null
  cccdPlace: string | null
  dob: Date | string | null
  address: string | null
  gender: string | null
  job: string | null
  licensePlate: string | null
}

interface Document {
  id: number
  fileName: string
  fileUrl: string
  fileSize: number | null
  fileType: string | null
  description: string | null
  createdAt: Date | string
}

export default function EditResidentPage() {
  const router = useRouter()
  const params = useParams()
  const residentId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [showUploadDoc, setShowUploadDoc] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    cccdNumber: '',
    cccdDate: '',
    cccdPlace: '',
    dob: '',
    address: '',
    gender: '',
    job: '',
    licensePlate: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resident, setResident] = useState<Resident | null>(null)

  useEffect(() => {
    if (residentId) {
      fetchResident()
      fetchDocuments()
    }
  }, [residentId])

  const fetchResident = async () => {
    try {
      const response = await fetch(`/api/residents/${residentId}`)
      const data = await response.json()

      if (response.ok) {
        setResident(data)
        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          email: data.email || '',
          cccdNumber: data.cccdNumber || '',
          cccdDate: data.cccdDate ? new Date(data.cccdDate).toISOString().split('T')[0] : '',
          cccdPlace: data.cccdPlace || '',
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
          address: data.address || '',
          gender: data.gender || '',
          job: data.job || '',
          licensePlate: data.licensePlate || ''
        })
      } else {
        alert(data.error || 'Không tìm thấy cư dân')
        router.push('/admin/residents')
      }
    } catch (error) {
      console.error('Error fetching resident:', error)
      alert('Có lỗi xảy ra khi tải thông tin cư dân')
      router.push('/admin/residents')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/residents/${residentId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const response = await fetch(`/api/residents/${residentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Cập nhật thông tin cư dân thành công!')
        router.push(`/admin/residents/${residentId}`)
        router.refresh()
      } else {
        setErrors({ submit: data.error || 'Có lỗi xảy ra' })
      }
    } catch (error) {
      console.error('Error updating resident:', error)
      setErrors({ submit: 'Có lỗi xảy ra khi cập nhật thông tin' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`/api/residents/${residentId}/upload-avatar`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResident(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null)
        alert('Cập nhật avatar thành công!')
      } else {
        alert(data.error || 'Có lỗi xảy ra khi upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Có lỗi xảy ra khi upload avatar')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB')
      e.target.value = ''
      return
    }

    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/residents/${residentId}/documents`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDocuments()
        alert('Tải lên hồ sơ thành công!')
        setShowUploadDoc(false)
      } else {
        const errorMsg = data.error || 'Có lỗi xảy ra khi tải lên hồ sơ'
        let details = ''
        
        if (data.code === 'PRISMA_CLIENT_NOT_GENERATED') {
          details = '\n\n⚠️ VUI LÒNG LÀM THEO CÁC BƯỚC SAU:\n' + 
                   '1. Mở Terminal/Command Prompt\n' +
                   '2. Chạy lệnh: npx prisma generate\n' +
                   '3. Chạy lệnh: npx prisma db push\n' +
                   '4. Restart dev server (Ctrl+C rồi npm run dev)\n' +
                   '5. Thử upload lại'
        } else if (data.details) {
          details = '\n\nChi tiết: ' + data.details
        }
        
        alert(errorMsg + details)
        console.error('Upload error:', data)
      }
    } catch (error: any) {
      console.error('Error uploading document:', error)
      alert(`Có lỗi xảy ra khi tải lên hồ sơ: ${error.message || 'Unknown error'}`)
    } finally {
      setUploadingDoc(false)
      e.target.value = ''
    }
  }

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) return

    try {
      const response = await fetch(`/api/residents/${residentId}/documents?documentId=${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDocuments()
        alert('Xóa hồ sơ thành công!')
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi xóa hồ sơ')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Có lỗi xảy ra khi xóa hồ sơ')
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!resident) {
    return null
  }

  const initials = getInitials(resident.fullName)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sửa thông tin Cư dân</h1>
          <p className="text-gray-600 mt-1">Cập nhật thông tin cá nhân và hồ sơ đính kèm</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/residents/${residentId}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <X size={18} />
            <span>Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ảnh đại diện</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {resident.avatarUrl ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img 
                      src={resident.avatarUrl} 
                      alt={resident.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-3xl">{initials}</span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2a4a6f] transition-colors shadow-lg">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Thay đổi ảnh đại diện</p>
                <p className="text-xs text-gray-500">JPG, PNG tối đa 5MB</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              <span>Thông tin cá nhân</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="NAM">Nam</option>
                  <option value="NU">Nữ</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nghề nghiệp
                </label>
                <input
                  type="text"
                  name="job"
                  value={formData.job}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* CCCD Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              <span>Thông tin CCCD/CMND</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số CCCD/CMND
                </label>
                <input
                  type="text"
                  name="cccdNumber"
                  value={formData.cccdNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày cấp
                </label>
                <input
                  type="date"
                  name="cccdDate"
                  value={formData.cccdDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nơi cấp
                </label>
                <input
                  type="text"
                  name="cccdPlace"
                  value={formData.cccdPlace}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Other Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khác</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biển số xe
              </label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Documents */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hồ sơ đính kèm</h3>
              <button 
                onClick={() => setShowUploadDoc(!showUploadDoc)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tải lên hồ sơ"
              >
                <Plus size={18} className="text-gray-600" />
              </button>
            </div>

            {showUploadDoc && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Tải lên hồ sơ mới</label>
                  <button
                    onClick={() => setShowUploadDoc(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="file"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDoc}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1e3a5f] file:text-white hover:file:bg-[#2a4a6f] disabled:opacity-50"
                />
                {uploadingDoc && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tải lên...</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc) => {
                  const isImage = doc.fileType?.startsWith('image/')
                  const Icon = isImage ? ImageIcon : FileText
                  const iconBg = isImage ? 'bg-green-100' : 'bg-blue-100'
                  const iconColor = isImage ? 'text-green-600' : 'text-blue-600'

                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={iconColor} size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={doc.fileUrl}
                          download
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={16} className="text-gray-600" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <X size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có hồ sơ đính kèm</p>
                  <p className="text-xs mt-1">Nhấn nút + để tải lên hồ sơ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
