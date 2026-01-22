'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, Shield, AlertCircle, KeyRound } from 'lucide-react'
import { DarkModeToggle } from '../components/DarkModeToggle'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (!parsedUser.isFirstLogin) {
      router.push(parsedUser.role === 'ADMIN' ? '/admin' : '/tenant')
      return
    }

    setUser(parsedUser)
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự'
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          userId: user.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        const updatedUser = { ...user, isFirstLogin: false }
        localStorage.setItem('user', JSON.stringify(updatedUser))

        setTimeout(() => {
          if (user.role === 'ADMIN') {
            router.push('/admin')
          } else {
            router.push('/tenant')
          }
        }, 2000)
      } else {
        setErrors({ submit: data.error || 'Có lỗi xảy ra' })
      }
    } catch (error) {
      console.error('Change password error:', error)
      setErrors({ submit: 'Có lỗi xảy ra, vui lòng thử lại' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-secondary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
          <p className="text-xs sm:text-sm text-secondary">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-secondary relative overflow-hidden">
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
          <DarkModeToggle />
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="card text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle className="text-green-600 dark:text-green-400 w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Đổi mật khẩu thành công!</h2>
            <p className="text-xs sm:text-sm text-secondary mb-4">Bạn sẽ được chuyển đến trang chủ...</p>
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mx-auto" size={24} />
          </div>
        </div>
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN'
  const currentPasswordLabel = isAdmin 
    ? 'Mật khẩu hiện tại' 
    : 'Mật khẩu hiện tại (Số CCCD)'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-secondary relative overflow-hidden">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
        <DarkModeToggle />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <img 
              src="/logo_final.png" 
              alt="EZ-Home Logo" 
              className="w-25 h-25 sm:w-30 sm:h-30 object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1.5 sm:mb-2">EZ-Home</h1>
          <p className="text-xs sm:text-sm text-secondary">Hệ thống quản lý nhà trọ thông minh</p>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <KeyRound size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-primary">Đổi mật khẩu lần đầu</h2>
            </div>
            <p className="text-xs sm:text-sm text-secondary mt-1.5 sm:mt-2">
              Vui lòng đổi mật khẩu để bảo mật tài khoản của bạn
            </p>
            {isAdmin && (
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
                <Shield size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Tài khoản Quản trị viên</span>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-700 dark:text-fg-danger-strong flex-1">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">
                {currentPasswordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                </div>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder={isAdmin ? "Nhập mật khẩu hiện tại" : "Nhập số CCCD"}
                  className={`input pl-9 sm:pl-10 pr-10 sm:pr-12 w-full ${errors.currentPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary hover:text-primary hover:bg-secondary transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.current ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                </div>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className={`input pl-9 sm:pl-10 pr-10 sm:pr-12 w-full ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary hover:text-primary hover:bg-secondary transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.new ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  {errors.newPassword}
                </p>
              )}
              <p className="mt-1.5 text-xs text-tertiary">
                Mật khẩu phải có ít nhất 6 ký tự và chứa cả chữ cái và số
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                </div>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`input pl-9 sm:pl-10 pr-10 sm:pr-12 w-full ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary hover:text-primary hover:bg-secondary transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords.confirm ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-2.5">
                <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <div className="text-xs text-blue-800 dark:text-blue-300 flex-1">
                  <p className="font-medium mb-1.5 text-primary">Lưu ý bảo mật:</p>
                  <ul className="space-y-1 list-disc list-inside text-secondary leading-relaxed">
                    <li>Không chia sẻ mật khẩu với người khác</li>
                    <li>Chọn mật khẩu mạnh, khó đoán</li>
                    <li>Đổi mật khẩu định kỳ để bảo mật</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary btn-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6 sm:mt-7"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-sm sm:text-base">Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span className="text-sm sm:text-base">Đổi mật khẩu</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
