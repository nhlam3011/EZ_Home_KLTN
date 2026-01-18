'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  Menu,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { DarkModeToggle } from '../components/DarkModeToggle'

const menuItems = [
  { href: '/tenant', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/tenant/invoices', label: 'Hóa đơn', icon: FileText },
  { href: '/tenant/services', label: 'Dịch vụ', icon: Grid3x3 },
  { href: '/tenant/issues', label: 'Báo hỏng', icon: Wrench },
  { href: '/tenant/community', label: 'Cộng đồng', icon: Users },
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

    if (parsedUser.isFirstLogin) {
      router.push('/change-password')
      return
    }

    setUser(parsedUser)

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
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden transition-opacity"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Beautiful Design */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl lg:shadow-none
        `}
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-primary)'
        }}
      >
        {/* Logo Section */}
        <div 
          className="h-16 px-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <Link 
            href="/tenant" 
            className="flex items-center gap-3 group"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-15 h-10 rounded-sm bg-white flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-200">
              <Image
                src="/logo_final.png"
                alt="Logo"
                width={50}
                height={50}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                EZ-Home
              </h1>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Tenant Portal
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Main Menu */}
          <div className="mb-5">
            <p 
              className="px-3 mb-3 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Menu
            </p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = item.href === '/tenant' 
                  ? pathname === '/tenant'
                  : pathname === item.href || pathname?.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${isActive ? 'shadow-sm' : ''}
                    `}
                    style={{
                      backgroundColor: isActive ? '#3b82f6' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                    )}
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={{
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-tertiary)',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="flex-1 text-sm font-semibold">
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Communication Menu */}
          <div 
            className="pt-5"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            <p 
              className="px-3 mb-3 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Giao tiếp
            </p>
            <div className="space-y-1">
              <Link
                href="/tenant/messages"
                onClick={() => setSidebarOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/') ? 'shadow-sm' : ''}
                `}
                style={{
                  backgroundColor: (pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) ? '#3b82f6' : 'transparent',
                  color: (pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) ? '#ffffff' : 'var(--text-primary)'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/tenant/messages' && !pathname?.startsWith('/tenant/messages/')) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/tenant/messages' && !pathname?.startsWith('/tenant/messages/')) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {(pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: (pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-tertiary)',
                    color: (pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <MessageSquare size={18} />
                </div>
                <span className="flex-1 text-sm font-semibold">
                  Tin nhắn
                </span>
                {unreadMessages > 0 && (
                  <span 
                    className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: (pathname === '/tenant/messages' || pathname?.startsWith('/tenant/messages/')) ? 'rgba(255, 255, 255, 0.25)' : '#ef4444'
                    }}
                  >
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                href="/tenant/settings"
                onClick={() => setSidebarOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/') ? 'shadow-sm' : ''}
                `}
                style={{
                  backgroundColor: (pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')) ? '#3b82f6' : 'transparent',
                  color: (pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')) ? '#ffffff' : 'var(--text-primary)'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/tenant/settings' && !pathname?.startsWith('/tenant/settings/')) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/tenant/settings' && !pathname?.startsWith('/tenant/settings/')) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {(pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: (pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')) ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-tertiary)',
                    color: (pathname === '/tenant/settings' || pathname?.startsWith('/tenant/settings/')) ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <Settings size={18} />
                </div>
                <span className="flex-1 text-sm font-semibold">
                  Cài đặt
                </span>
              </Link>
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div 
          className="p-4 space-y-2"
          style={{ 
            borderTop: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-tertiary)'
          }}
        >
          <div 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
              {user.fullName?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {user.fullName || 'Tenant'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                {user.room?.name || 'P.000'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            style={{ backgroundColor: '#ef4444' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header 
          className="h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-primary)'
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Link
              href="/tenant/notifications"
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Bell size={20} />
              {unreadMessages > 0 && (
                <span 
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
                  style={{ 
                    backgroundColor: '#ef4444',
                    borderColor: 'var(--bg-primary)'
                  }}
                ></span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
