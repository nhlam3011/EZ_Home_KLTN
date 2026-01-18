'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('admin123')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/auth/reset-admin-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone,
          newPassword: newPassword || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('Có lỗi xảy ra khi reset mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  const handleCheck = async () => {
    if (!phone) {
      setError('Vui lòng nhập số điện thoại')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/auth/check-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Check password error:', error)
      setError('Có lỗi xảy ra khi kiểm tra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-blue-900/20 via-primary dark:via-secondary to-blue-50 dark:to-blue-900/20 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Lock className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Reset Mật khẩu Admin</h2>
          <p className="text-secondary">
            Hash lại mật khẩu cho admin user
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && result.success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{result.message}</p>
                {result.phone && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Số điện thoại: {result.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {result && !result.success && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Thông tin user:</h3>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <p><span className="font-medium">Phone:</span> {result.phone}</p>
              <p><span className="font-medium">Tên:</span> {result.fullName}</p>
              <p><span className="font-medium">Role:</span> {result.role}</p>
              <p><span className="font-medium">Password đã hash:</span> {result.isPasswordHashed ? '✅ Có' : '❌ Chưa'}</p>
              {result.isPasswordValid !== undefined && (
                <p><span className="font-medium">Password hợp lệ:</span> {result.isPasswordValid ? '✅ Có' : '❌ Không'}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Số điện thoại Admin
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                required
                className="input flex-1"
              />
              <button
                type="button"
                onClick={handleCheck}
                disabled={loading || !phone}
                className="btn-secondary whitespace-nowrap disabled:opacity-50"
              >
                Kiểm tra
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Mật khẩu mới (để trống = "admin123")
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="admin123"
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full btn-primary h-12 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Reset Mật khẩu</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-primary">
          <p className="text-xs text-tertiary text-center">
            Hoặc sử dụng script: <br />
            <code className="bg-tertiary px-2 py-1 rounded text-xs text-primary">
              npx ts-node scripts/hash-admin-password.ts [phone] [password]
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
