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
  ChevronRight,
  Menu,
  X
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-gradient-to-b from-[#1e3a5f] to-[#152d47] text-white flex flex-col shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & User Info */}
        <div className="p-6 border-b border-[#2a4a6f]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
              {user.fullName?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">Tenant Portal</h1>
              <p className="text-sm text-blue-200 truncate mt-0.5">{user.room?.name || 'Căn hộ'}</p>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs uppercase text-blue-300 px-4 py-3 font-semibold tracking-wider">
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
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#1e3a5f] shadow-lg scale-[1.02]'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
                }`}
              >
                <Icon size={22} className={`flex-shrink-0 ${isActive ? 'text-[#1e3a5f]' : ''}`} />
                <span className="flex-1 font-medium text-base">{item.label}</span>
                {isActive && (
                  <ChevronRight size={18} className="text-[#1e3a5f] flex-shrink-0" />
                )}
              </Link>
            )
          })}

          <div className="pt-6 mt-6 border-t border-[#2a4a6f]">
            <p className="text-xs uppercase text-blue-300 px-4 py-3 font-semibold tracking-wider">
              GIAO TIẾP
            </p>
            <Link
              href="/tenant/messages"
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 relative ${
                pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')
                  ? 'bg-white text-[#1e3a5f] shadow-lg scale-[1.02]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
              }`}
            >
              <MessageSquare size={22} className={`flex-shrink-0 ${pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/') ? 'text-[#1e3a5f]' : ''}`} />
              <span className="flex-1 font-medium text-base">Tin nhắn</span>
              {unreadMessages > 0 && (
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md flex-shrink-0 ${
                  pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
              {(pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) && (
                <ChevronRight size={18} className="text-[#1e3a5f] flex-shrink-0" />
              )}
            </Link>
            <Link
              href="/tenant/settings"
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 mt-2 ${
                pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')
                  ? 'bg-white text-[#1e3a5f] shadow-lg scale-[1.02]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white hover:scale-[1.01]'
              }`}
            >
              <Settings size={22} className={`flex-shrink-0 ${pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/') ? 'text-[#1e3a5f]' : ''}`} />
              <span className="flex-1 font-medium text-base">Cài đặt</span>
              {(pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')) && (
                <ChevronRight size={18} className="text-[#1e3a5f] flex-shrink-0" />
              )}
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#2a4a6f] bg-[#152d47]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
              {user.fullName?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.fullName || 'Tenant'}</p>
              <p className="text-xs text-blue-200 truncate mt-0.5">{user.room?.name || 'P.000'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-3 font-medium"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={24} className="text-gray-700" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">EZ-Home</h2>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/tenant/notifications"
                className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
