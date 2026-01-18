'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
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
        // Store user data in localStorage (in production, use secure httpOnly cookies)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token || 'demo-token')

        // Check if first login - redirect to change password page
        if (data.user.isFirstLogin) {
          router.push('/change-password')
        } else {
          // Redirect based on role
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-secondary">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/logo_final.png" 
              alt="EZ-Home Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">EZ-Home</h1>
          <p className="text-secondary">Hệ thống quản lý nhà trọ thông minh</p>
        </div>

        {/* Login Card */}
        <div className="card animate-fade-in">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">Đăng nhập</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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
                className="input"
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
                  className="input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-primary">
            <p className="text-sm text-secondary text-center">
              <span className="text-tertiary">Lưu ý: </span>
              Khách mới sử dụng số CCCD làm mật khẩu ban đầu
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-tertiary mt-6">
          KLTN - KHMT64 - Nguyen Nhat Lam
        </p>
      </div>
    </div>
  )
}
