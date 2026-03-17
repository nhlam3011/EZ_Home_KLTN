'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, Shield, AlertCircle, KeyRound, Sparkles, ShieldCheck } from 'lucide-react'
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
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0c]">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1)_0%,_rgba(0,0,0,1)_100%)]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
        </div>
        <Loading size="lg" text="Đang tải..." />
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN'
  const currentPasswordLabel = isAdmin
    ? 'Mật khẩu hiện tại'
    : 'Mật khẩu hiện tại (Số CCCD)'

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050507] selection:bg-blue-500/30 font-sans">
      {/* 1. FIXED TOP-RIGHT DARK MODE TOGGLE */}
      <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group flex items-center gap-2">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden sm:block px-1">Giao diện</div>
          <DarkModeToggle />
        </div>
      </div>

      {/* 2. ENHANCED DYNAMIC BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#111827_0%,_#000000_100%)]"></div>

        {/* Animated Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/15 blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-[1] opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}>
      </div>

      <div className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* --- CONTENT --- */}
      <div className={`relative z-10 w-full max-w-xl px-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

        {/* BRAND HERO SECTION */}
        <div className="text-center mb-10">
          <div className="mb-4 relative inline-block group">
            <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full scale-125 group-hover:bg-blue-400/30 transition-all duration-700"></div>
            <img
              src="/logo_final.png"
              alt="EZ-Home Logo"
              className="relative w-28 h-28 object-contain filter drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 leading-tight">
            EZ HOME
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Cập nhật bảo mật</span>
          </div>
        </div>

        {/* CHANGE PASSWORD CARD */}
        <div className="bg-white/[0.03] backdrop-blur-[40px] border border-white/[0.08] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative">
          {/* Accent Glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

          {success ? (
            <div className="p-14 text-center animate-in zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-8 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <CheckCircle className="text-green-400 w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Cập nhật thành công</h2>
              <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">Mật khẩu của bạn đã được thay đổi. Hệ thống đang chuyển hướng...</p>
              <div className="mt-10 flex justify-center">
                <div className="p-2 bg-white/5 rounded-full">
                  <LoadingSpinner size={36} className="text-green-500" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 sm:p-14">
              <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                  <KeyRound size={14} className="text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Security Upgrade</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Bảo mật tài khoản</h2>
                <p className="text-sm font-medium text-gray-400 mt-2">Vui lòng cập nhật mật khẩu mới để tiếp tục sử dụng hệ thống.</p>

                {isAdmin && (
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <Shield size={14} className="text-amber-400" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-tight">Quyền quản trị viên</span>
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 animate-shake">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle size={18} className="text-red-400" />
                  </div>
                  <p className="text-xs text-red-300 font-bold leading-relaxed">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1 block">
                    {currentPasswordLabel}
                  </label>
                  <div className="relative group">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder={isAdmin ? "Nhập mật khẩu cũ" : "Nhập số CCCD của bạn"}
                      className={`w-full h-15 bg-white/[0.04] border ${errors.currentPassword ? 'border-red-500/40' : 'border-white/10'} rounded-2xl px-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold group-focus-within:bg-white/[0.08]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-all"
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="text-[11px] text-red-400 ml-1 font-bold">*{errors.currentPassword}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1 block">Mật khẩu mới</label>
                  <div className="relative group">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`w-full h-15 bg-white/[0.04] border ${errors.newPassword ? 'border-red-500/40' : 'border-white/10'} rounded-2xl px-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold group-focus-within:bg-white/[0.08]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-all"
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-[11px] text-red-400 ml-1 font-bold">*{errors.newPassword}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1 block">Xác nhận mật khẩu</label>
                  <div className="relative group">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full h-15 bg-white/[0.04] border ${errors.confirmPassword ? 'border-red-500/40' : 'border-white/10'} rounded-2xl px-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-bold group-focus-within:bg-white/[0.08]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-all"
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] text-red-400 ml-1 font-bold">*{errors.confirmPassword}</p>}
                </div>

                <div className="pt-6">
                  <div className="p-6 rounded-3xl bg-blue-900/10 border border-blue-500/10 flex items-start gap-4 mb-8 backdrop-blur-md">
                    <ShieldCheck size={22} className="text-blue-400 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Tiêu chuẩn mật khẩu</h4>
                      <ul className="text-[11px] text-gray-500 space-y-1 font-medium list-disc list-inside">
                        <li>Độ dài tối thiểu 6 ký tự</li>
                        <li>Nên bao gồm cả chữ và số</li>
                        <li>Tránh sử dụng thông tin cá nhân</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group/btn relative w-full h-16 rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.98] disabled:opacity-70"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 group-hover/btn:from-blue-600 group-hover/btn:to-indigo-600 transition-all duration-500"></div>
                    <div className="relative flex items-center justify-center gap-4 text-white font-black text-lg tracking-wider">
                      {loading ? (
                        <LoadingSpinner size={28} className="text-white" />
                      ) : (
                        <>
                          <span>XÁC NHẬN CẬP NHẬT</span>
                          <Lock size={20} />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Improved Footer */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <p className="text-gray-600 text-[10px] font-bold tracking-[0.3em] uppercase">EZ-Home Security Infrastructure</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}
