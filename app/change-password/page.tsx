'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { DarkModeToggle } from '../components/DarkModeToggle'
import Loading, { LoadingSpinner } from '@/components/Loading'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
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
    setMounted(true)
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0f172a] relative overflow-hidden">
        <Loading size="lg" text="Đang tải..." />
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN'
  const currentPasswordLabel = isAdmin
    ? 'Mật khẩu hiện tại'
    : 'Mật khẩu hiện tại (Số CCCD)'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0f172a] relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/30 dark:bg-blue-400/20 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-purple-500/30 dark:bg-purple-400/20 blur-[120px] animate-pulse [animation-delay:2s]"></div>
        <div className="absolute bottom-[-5%] left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/30 dark:bg-indigo-400/20 blur-[120px] animate-pulse [animation-delay:4s]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] rounded-full bg-pink-500/20 dark:bg-pink-400/10 blur-[100px] animate-pulse [animation-delay:1s]"></div>
      </div>

      {/* Dot Grid Pattern Overlay */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.6] dark:opacity-[0.2]"
        style={{
          backgroundImage: 'radial-gradient(#64748b 0.8px, transparent 0.8px)',
          backgroundSize: '32px 32px'
        }}
      ></div>

      {/* Dark Mode Toggle */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30">
        <DarkModeToggle />
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-20">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo_final.png"
              alt="EZ-Home Logo"
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">EZ-Home</h1>
          <p className="text-sm sm:text-base text-secondary">Cập nhật bảo mật tài khoản</p>
        </div>

        {/* Change Password Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-6 sm:p-8 border border-white/20 dark:border-gray-700/30 ring-1 ring-black/5 dark:ring-white/5">
          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                <CheckCircle className="text-green-600 dark:text-green-400 w-10 h-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Cập nhật thành công</h2>
              <p className="text-sm text-secondary mb-6">Mật khẩu của bạn đã được thay đổi</p>
              <div className="flex justify-center">
                <LoadingSpinner size={32} className="text-green-500" />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-1">Đổi mật khẩu</h2>
                <p className="text-xs sm:text-sm text-secondary">Vui lòng cập nhật mật khẩu mới để tiếp tục</p>
              </div>

              {errors.submit && (
                <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 flex-1">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    {currentPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder={isAdmin ? "Nhập mật khẩu cũ" : "Nhập số CCCD của bạn"}
                      className={`input w-full h-12 px-4 pr-12 text-sm sm:text-base ${errors.currentPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`input w-full h-12 px-4 pr-12 text-sm sm:text-base ${errors.newPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Nhập lại mật khẩu"
                      className={`input w-full h-12 px-4 pr-12 text-sm sm:text-base ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/15 flex items-start gap-2">
                  <KeyRound size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-secondary">
                    Mật khẩu phải có ít nhất 6 ký tự, bao gồm cả chữ và số
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary h-12 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size={20} className="text-white" />
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
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-tertiary mt-6">
          KLTN - KHMT64 - Nguyen Nhat Lam
        </p>
      </div>
    </div>
  )
}
