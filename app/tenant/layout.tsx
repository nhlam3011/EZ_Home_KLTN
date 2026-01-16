'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Grid3x3, 
  Wrench, 
  Users,
  Settings,
  Bell,
  LogOut,
  MessageSquare,
  ChevronRight
} from 'lucide-react'
import { useEffect, useState } from 'react'

const menuItems = [
  { href: '/tenant', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/tenant/invoices', label: 'Hóa đơn', icon: FileText },
  { href: '/tenant/services', label: 'Dịch vụ', icon: Grid3x3 },
  { href: '/tenant/issues', label: 'Báo hỏng', icon: Wrench },
  { href: '/tenant/community', label: 'Cộng đồng', icon: Users },
]

const accountItems = [
  { href: '/tenant/profile', label: 'Hồ sơ cá nhân' },
  { href: '/tenant/settings', label: 'Cài đặt' },
]

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'TENANT') {
      router.push('/login')
      return
    }

    // Check if first login - redirect to change password
    if (parsedUser.isFirstLogin) {
      router.push('/change-password')
      return
    }

    setUser(parsedUser)

    // Fetch unread messages count
    fetch('/api/messages/unread-count')
      .then(res => res.json())
      .then(data => setUnreadMessages(data.count || 0))
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
        {/* Logo & User Info */}
        <div className="p-6 border-b border-[#2a4a6f]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.fullName?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">Tenant Portal</h1>
              <p className="text-xs text-blue-200 truncate">{user.room?.name || 'Căn hộ'}</p>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs uppercase text-blue-300 px-3 py-2 font-semibold tracking-wider">
            MENU
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon
            // Fix: For /tenant, only match exactly. For other routes, match exact or sub-routes
            const isActive = item.href === '/tenant' 
              ? pathname === '/tenant'
              : pathname === item.href || pathname?.startsWith(item.href + '/')
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
                <span className="flex-1 font-medium">{item.label}</span>
                {isActive && (
                  <ChevronRight size={16} className="text-[#1e3a5f]" />
                )}
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-[#2a4a6f]">
            <p className="text-xs uppercase text-blue-300 px-3 py-2 font-semibold tracking-wider">
              GIAO TIẾP
            </p>
            <Link
              href="/tenant/messages"
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
                pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')
                  ? 'bg-white text-[#1e3a5f] shadow-lg'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare size={20} className={pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/') ? 'text-[#1e3a5f]' : ''} />
              <span className="flex-1 font-medium">Tin nhắn</span>
              {unreadMessages > 0 && (
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                  pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
              {(pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) && (
                <ChevronRight size={16} className="text-[#1e3a5f]" />
              )}
            </Link>
            <Link
              href="/tenant/settings"
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')
                  ? 'bg-white text-[#1e3a5f] shadow-lg'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings size={20} className={pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/') ? 'text-[#1e3a5f]' : ''} />
              <span className="font-medium">Cài đặt</span>
              {(pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')) && (
                <ChevronRight size={16} className="text-[#1e3a5f]" />
              )}
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2a4a6f] bg-[#152d47]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
              {user.fullName?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.fullName || 'Tenant'}</p>
              <p className="text-xs text-blue-200 truncate">{user.room?.name || 'P.000'}</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900">EZ-Home</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/tenant/notifications"
                className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </Link>
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
