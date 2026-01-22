'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Lock, 
  Bell, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  KeyRound,
  Settings2,
  Mail,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react'

interface UserData {
  id: number
  fullName: string
  phone: string
  email: string | null
}

type TabType = 'password' | 'notifications'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('password')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    invoice: true,
    message: true,
    issue: true,
    email: true
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      const response = await fetch(`/api/tenant/me?userId=${parsedUser.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số'
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!validatePasswordForm()) {
      return
    }

    setSaving(true)
    setErrors({})
    setSuccess('')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          userId: user.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setSuccess('Đổi mật khẩu thành công!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setErrors({ submit: data.error || 'Có lỗi xảy ra khi đổi mật khẩu' })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setErrors({ submit: 'Có lỗi xảy ra khi đổi mật khẩu' })
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500 dark:text-blue-400" size={40} />
          <p className="text-sm text-secondary">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Settings2 size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Cài đặt</h1>
        </div>
        <p className="text-sm sm:text-base text-secondary mt-1">
          Quản lý mật khẩu và tùy chọn thông báo
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-lg flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="p-4 rounded-lg flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{errors.submit}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-primary/10">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'password'
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Shield size={18} />
            <span>Bảo mật</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Bell size={18} />
            <span>Thông báo</span>
          </button>
        </div>
      </div>

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <KeyRound size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-primary">Đổi mật khẩu</h2>
            </div>
            <p className="text-sm text-secondary mt-2">
              Cập nhật mật khẩu của bạn để bảo vệ tài khoản
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                  className="input w-full pr-10"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-secondary"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm mt-1.5 text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  className="input w-full pr-10"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-secondary"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm mt-1.5 text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.newPassword}
                </p>
              )}
              <p className="text-xs mt-1.5 text-tertiary">
                Mật khẩu phải có ít nhất 6 ký tự và chứa cả chữ cái và số
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className="input w-full pr-10"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-secondary"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm mt-1.5 text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-primary/10">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-md flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang đổi...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Đổi mật khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Bell size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-primary">Cài đặt thông báo</h2>
            </div>
            <p className="text-sm text-secondary mt-2">
              Quản lý các thông báo bạn muốn nhận từ hệ thống
            </p>
          </div>

          <div className="space-y-5">
            {/* Invoice Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-primary mb-0.5">Thông báo hóa đơn</h4>
                  <p className="text-xs text-secondary">
                    Nhận thông báo khi có hóa đơn mới hoặc hóa đơn sắp đến hạn thanh toán
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.invoice}
                  onChange={() => handleNotificationToggle('invoice')}
                  className="sr-only peer" 
                />
                <div className="relative w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors duration-200">
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notificationSettings.invoice ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>

            {/* Message Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <MessageSquare size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-primary mb-0.5">Thông báo tin nhắn</h4>
                  <p className="text-xs text-secondary">
                    Nhận thông báo khi có tin nhắn mới từ quản lý tòa nhà
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.message}
                  onChange={() => handleNotificationToggle('message')}
                  className="sr-only peer" 
                />
                <div className="relative w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors duration-200">
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notificationSettings.message ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>

            {/* Issue Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-primary mb-0.5">Thông báo sự cố</h4>
                  <p className="text-xs text-secondary">
                    Nhận thông báo khi trạng thái sự cố bảo trì được cập nhật
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.issue}
                  onChange={() => handleNotificationToggle('issue')}
                  className="sr-only peer" 
                />
                <div className="relative w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors duration-200">
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notificationSettings.issue ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>

            {/* Email Notification */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Mail size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-primary mb-0.5">Thông báo email</h4>
                  <p className="text-xs text-secondary">
                    Nhận thông báo quan trọng qua email
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.email}
                  onChange={() => handleNotificationToggle('email')}
                  className="sr-only peer" 
                />
                <div className="relative w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors duration-200">
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notificationSettings.email ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-primary/10">
            <p className="text-xs text-tertiary">
              Các cài đặt sẽ được lưu tự động khi bạn thay đổi
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
