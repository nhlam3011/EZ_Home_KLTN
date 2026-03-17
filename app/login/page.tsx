'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { DarkModeToggle } from '../components/DarkModeToggle'
import { LoadingSpinner } from '@/components/Loading'

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
          <p className="text-sm sm:text-base text-secondary">Hệ thống quản lý nhà trọ thông minh</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-6 sm:p-8 border border-white/20 dark:border-gray-700/30 ring-1 ring-black/5 dark:ring-white/5">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-1">Đăng nhập</h2>
            <p className="text-xs sm:text-sm text-secondary">Nhập thông tin để truy cập hệ thống</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Nhập số điện thoại"
                required
                className="input w-full h-12 px-4 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Nhập mật khẩu"
                  required
                  className="input w-full h-12 px-4 pr-12 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary h-12 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <LoadingSpinner size={20} className="text-white" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/15">
              <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-secondary leading-relaxed">
                <span className="font-medium text-primary">Lưu ý: </span>
                Khách mới sử dụng số CCCD làm mật khẩu ban đầu
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-tertiary mt-6">
          KLTN - KHMT64 - Nguyen Nhat Lam
        </p>
      </div>
    </div>
  )
}
