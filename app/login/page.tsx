'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, LogIn, Phone, Lock, AlertCircle } from 'lucide-react'
import { DarkModeToggle } from '../components/DarkModeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token || 'demo-token')

        if (data.user.isFirstLogin) {
          router.push('/change-password')
        } else {
          if (data.user.role === 'ADMIN') {
            router.push('/admin')
          } else {
            router.push('/tenant')
          }
        }
      } else {
        setError(data.error || 'Đăng nhập thất bại')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

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

        {/* Login Card */}
        <div className="card">
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <LogIn size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-primary">Đăng nhập</h2>
            </div>
            <p className="text-xs sm:text-sm text-secondary mt-1.5 sm:mt-2">
              Nhập thông tin để truy cập hệ thống
            </p>
          </div>
          
          {error && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-700 dark:text-fg-danger-strong flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">
                Số điện thoại
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Nhập số điện thoại"
                  required
                  className="input pl-9 sm:pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Nhập mật khẩu"
                  required
                  className="input pl-9 sm:pl-10 pr-10 sm:pr-12 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-secondary hover:text-primary hover:bg-secondary transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                </button>
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
                  <span className="text-sm sm:text-base">Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span className="text-sm sm:text-base">Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-primary/10">
            <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
              <AlertCircle size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-secondary leading-relaxed">
                <span className="font-medium text-primary">Lưu ý: </span>
                Khách mới sử dụng số CCCD làm mật khẩu ban đầu
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-tertiary mt-5 sm:mt-6">
          KLTN - KHMT64 - Nguyen Nhat Lam
        </p>
      </div>
    </div>
  )
}
