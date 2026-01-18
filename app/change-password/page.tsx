'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, Loader2, Shield, AlertCircle } from 'lucide-react'
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
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (!parsedUser.isFirstLogin) {
      // Not first login, redirect to dashboard
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
        // Update user in localStorage
        const updatedUser = { ...user, isFirstLogin: false }
        localStorage.setItem('user', JSON.stringify(updatedUser))

        // Redirect after 2 seconds
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
      <div className="min-h-screen flex items-center justify-center relative">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-secondary">
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <DarkModeToggle />
        </div>
        <div className="card max-w-md w-full text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 border border-green-200 dark:border-green-800">
            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Đổi mật khẩu thành công!</h2>
          <p className="text-secondary mb-4">Bạn sẽ được chuyển đến trang chủ...</p>
          <Loader2 className="animate-spin text-primary mx-auto" size={24} />
        </div>
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN'
  const currentPasswordLabel = isAdmin 
    ? 'Mật khẩu hiện tại' 
    : 'Mật khẩu hiện tại (Số CCCD)'

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-secondary">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <DarkModeToggle />
      </div>
      <div className="card max-w-md w-full relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 border border-blue-200 dark:border-blue-800">
            {isAdmin ? (
              <Shield className="text-blue-600 dark:text-blue-400" size={32} />
            ) : (
              <Lock className="text-blue-600 dark:text-blue-400" size={32} />
            )}
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            Đổi mật khẩu lần đầu
          </h2>
          <p className="text-secondary">
            Vui lòng đổi mật khẩu để bảo mật tài khoản của bạn
          </p>
          {isAdmin && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
              <Shield size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Tài khoản Quản trị viên</span>
            </div>
          )}
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {currentPasswordLabel} <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder={isAdmin ? "Nhập mật khẩu hiện tại" : "Nhập số CCCD"}
                className={`input pr-12 ${errors.currentPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
              >
                {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Mật khẩu mới <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự, có chữ và số)"
                className={`input pr-12 ${errors.newPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
            )}
            <p className="mt-1 text-xs text-tertiary">
              Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Xác nhận mật khẩu mới <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Nhập lại mật khẩu mới"
                className={`input pr-12 ${errors.confirmPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
              >
                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Lưu ý bảo mật:</p>
                <ul className="space-y-1 list-disc list-inside">
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
            className="w-full btn-primary h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>Đổi mật khẩu</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
