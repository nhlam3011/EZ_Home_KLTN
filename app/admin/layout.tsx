'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Wrench, 
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  TrendingUp
} from 'lucide-react'
import { useEffect, useState } from 'react'

const menuItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/rooms', label: 'Quản lý Phòng', icon: Building2 },
  { href: '/admin/residents', label: 'Cư dân', icon: Users },
  { href: '/admin/finance', label: 'Tài chính', icon: FileText },
  { href: '/admin/maintenance', label: 'Bảo trì & Sự cố', icon: Wrench, badge: true },
  { href: '/admin/forecast', label: 'Dự đoán AI', icon: TrendingUp },
]

const systemItems = [
  { href: '/admin/services', label: 'Cấu hình Dịch vụ', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    // Check if first login - redirect to change password
    if (parsedUser.isFirstLogin) {
      router.push('/change-password')
      return
    }

    setUser(parsedUser)

    // Fetch pending issues count
    fetch('/api/maintenance/count')
      .then(res => res.json())
      .then(data => setPendingCount(data.count || 0))
      .catch(() => {})
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#1e3a5f] to-[#152d47] text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a4a6f]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="text-[#1e3a5f]" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold">EZ-Home</h1>
              <p className="text-xs text-blue-200">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs uppercase text-blue-300 px-3 py-2 font-semibold tracking-wider">
            MENU CHÍNH
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon
            // Fix: For /admin, only match exactly. For other routes, match exact or sub-routes
            const isActive = item.href === '/admin' 
              ? pathname === '/admin'
              : pathname === item.href || pathname?.startsWith(item.href + '/')
            const showBadge = item.badge && pendingCount > 0
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-white text-[#1e3a5f] shadow-lg'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#1e3a5f]' : ''} />
                <span className="flex-1 font-medium">{item.label}</span>
                {showBadge && (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                    isActive ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
                {isActive && (
                  <ChevronRight size={16} className="text-[#1e3a5f]" />
                )}
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-[#2a4a6f]">
            <p className="text-xs uppercase text-blue-300 px-3 py-2 font-semibold tracking-wider">
              HỆ THỐNG
            </p>
            {systemItems.map((item) => {
              const Icon = item.icon
              // Fix: Match exact or sub-routes for system items
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#1e3a5f] shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-[#1e3a5f]' : ''} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight size={16} className="text-[#1e3a5f]" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2a4a6f] bg-[#152d47]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
              {user.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.fullName || 'Admin User'}</p>
              <p className="text-xs text-blue-200 truncate">admin@ezhome.vn</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-4">
              <button className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
