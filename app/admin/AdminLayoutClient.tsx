'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  Wrench,
  Settings,
  SlidersHorizontal,
  Bell,
  LogOut,
  TrendingUp,
  Menu,
  X,
  Users as CommunityIcon,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  Calendar,
  Clock as ClockIcon,
  Bot
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { DarkModeToggle } from '../components/DarkModeToggle'
import { pusherClient } from '@/lib/pusher-client'
import { CHANNELS, EVENTS } from '@/lib/pusher-shared'
import { BuildingProvider, useBuilding } from '../../components/BuildingContext'

const menuItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/rooms', label: 'Quản lý Phòng', icon: Building2 },
  { href: '/admin/residents', label: 'Cư dân', icon: Users },
  { href: '/admin/finance', label: 'Tài chính', icon: FileText, activePaths: ['/admin/invoices'] },
  { href: '/admin/renewals', label: 'Gia hạn HĐ', icon: RefreshCw, badge: true },
  { href: '/admin/maintenance', label: 'Bảo trì & Sự cố', icon: Wrench, badge: true },
  { href: '/admin/community', label: 'Cộng đồng', icon: CommunityIcon, badge: true },
  { href: '/admin/messages', label: 'Tin nhắn', icon: MessageSquare },
  { href: '/admin/forecast', label: 'Dự đoán AI', icon: TrendingUp },
  { href: '/admin/ai-assistant', label: 'Trợ lý EZ', icon: Bot },
]

const systemItems = [
  { href: '/admin/buildings', label: 'Cấu hình tòa nhà', icon: Home },
  { href: '/admin/owner-contracts', label: 'Hợp đồng ủy thác', icon: FileText },
  { href: '/admin/services', label: 'Cấu hình Dịch vụ', icon: Settings },
  { href: '/admin/settings', label: 'Cài đặt', icon: SlidersHorizontal },
]

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { selectedBuildingId, setSelectedBuildingId, buildings, loading: buildingsLoading } = useBuilding()
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingPostsCount, setPendingPostsCount] = useState(0)
  const [pendingRenewalsCount, setPendingRenewalsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Map pathname to page title
  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      '/admin': 'Admin Dashboard',
      '/admin/buildings': 'Cấu hình tòa nhà',
      '/admin/owner-contracts': 'Hợp đồng ủy thác',
      '/admin/rooms': 'Quản lý Phòng',
      '/admin/residents': 'Cư dân',
      '/admin/invoices': 'Tài chính',
      '/admin/finance': 'Chốt điện nước',
      '/admin/maintenance': 'Bảo trì & Sự cố',
      '/admin/community': 'Cộng đồng',
      '/admin/messages': 'Tin nhắn',
      '/admin/notifications': 'Thông báo',
      '/admin/forecast': 'Dự đoán AI',
      '/admin/services': 'Cấu hình Dịch vụ',
      '/admin/settings': 'Cài đặt',
      '/admin/ai-assistant': 'Trợ lý EZ',
    }

    // Check exact match first
    if (titleMap[pathname]) {
      return titleMap[pathname]
    }

    // Check for sub-routes
    for (const [path, title] of Object.entries(titleMap)) {
      if (pathname?.startsWith(path + '/')) {
        return title
      }
    }

    return ''
  }

  // Generate Breadcrumbs
  const getBreadcrumbs = () => {
    const titleMap: Record<string, string> = {
      '/admin/buildings': 'Cấu hình tòa nhà',
      '/admin/owner-contracts': 'Hợp đồng ủy thác',
      '/admin/rooms': 'Quản lý Phòng',
      '/admin/residents': 'Cư dân',
      '/admin/finance': 'Tài chính',
      '/admin/invoices': 'Hóa đơn',
      '/admin/renewals': 'Gia hạn HĐ',
      '/admin/maintenance': 'Bảo trì & Sự cố',
      '/admin/community': 'Cộng đồng',
      '/admin/messages': 'Tin nhắn',
      '/admin/notifications': 'Thông báo',
      '/admin/forecast': 'Dự đoán AI',
      '/admin/services': 'Cấu hình Dịch vụ',
      '/admin/settings': 'Cài đặt',
    }

    const paths = pathname.split('/').filter(p => p)
    const breadcrumbs = []
    let currentPath = ''

    for (let i = 0; i < paths.length; i++) {
      currentPath += `/${paths[i]}`
      if (i === 0) continue // Bỏ qua phần 'admin' hoặc 'tenant' vì đã có link hardcode ở ngoài

      let label = titleMap[currentPath] || paths[i]

      // Nếu là ID tòa nhà, tìm tên tòa nhà trong list
      if (!titleMap[currentPath] && !isNaN(Number(paths[i]))) {
        const building = buildings.find((b: any) => b.id === Number(paths[i]))
        if (building) label = building.name
      }

      breadcrumbs.push({ label, href: currentPath, isLast: i === paths.length - 1 })
    }

    return breadcrumbs
  }

  const formatHeaderDate = () => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
    const dayName = days[currentTime.getDay()]
    const date = currentTime.getDate().toString().padStart(2, '0')
    const month = (currentTime.getMonth() + 1).toString().padStart(2, '0')
    const year = currentTime.getFullYear()
    const hours = currentTime.getHours().toString().padStart(2, '0')
    const minutes = currentTime.getMinutes().toString().padStart(2, '0')
    return `${dayName}, ${date}/${month}/${year} • ${hours}:${minutes}`
  }

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const userData = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    if (parsedUser.isFirstLogin) {
      router.push('/change-password')
      return
    }

    setUser(parsedUser)

    fetch('/api/maintenance/count')
      .then(res => res.json())
      .then(data => setPendingCount(data.count || 0))
      .catch(() => { })

    fetch('/api/admin/posts?status=PENDING')
      .then(res => res.json())
      .then(data => setPendingPostsCount(data.length || 0))
      .catch(() => { })

    // Fetch unread messages count
    if (parsedUser.id) {
      fetch(`/api/admin/messages?userId=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          const totalUnread = Object.values(data.unreadCounts || {}).reduce((sum: number, count: any) => sum + count, 0)
          setUnreadMessagesCount(totalUnread)
        })
        .catch(() => { })

      // Fetch unread notifications count (new posts in last 7 days)
      fetch(`/api/admin/notifications?userId=${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          const recentNotifications = data.filter((notif: any) => {
            const notifDate = new Date(notif.createdAt)
            return notifDate >= sevenDaysAgo
          })
          setUnreadNotificationsCount(recentNotifications.length)
        })
        .catch(() => { })

      // Fetch pending renewals count
      fetch('/api/contracts/renewals?status=PENDING')
        .then(res => res.json())
        .then(data => {
          setPendingRenewalsCount(Array.isArray(data) ? data.length : (data.renewals?.length || 0))
        })
        .catch(() => { })

      // Pusher real-time updates for Admin
      const channel = pusherClient.subscribe(CHANNELS.ADMIN_MESSAGES)
      channel.bind(EVENTS.NEW_MESSAGE, (data: { message: any }) => {
        if (data.message.sender.role === 'TENANT') {
          // Chỉ tăng unread nếu không đang trong route messages của đúng tenant đó
          // Vì layout không biết selectedTenant cụ thể trong page, 
          // ta chỉ có thể đơn giản là tăng count nếu không ở trang messages nói chung
          // hoặc luôn tăng và để page xử lý việc giảm/đánh dấu đã đọc.
          if (window.location.pathname !== '/admin/messages') {
            setUnreadMessagesCount(prev => prev + 1)
          }
        }
      })

      return () => {
        pusherClient.unsubscribe(CHANNELS.ADMIN_MESSAGES)
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
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
            href="/admin"
            className="flex items-center gap-3 group"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex items-center justify-center">
              <img
                src="/logo_final.png?v=1"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                EZ-Home
              </h1>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Admin Portal
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden lg:flex items-center flex-shrink-0">
              <DarkModeToggle />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg transition-all"
              style={{
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Main Menu */}
          <div className="mb-5">
            <p
              className="px-3 mb-3 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Menu chính
            </p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isAiItem = item.href === '/admin/ai-assistant'
                const isActive = item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href ||
                  pathname?.startsWith(item.href + '/') ||
                  (item.activePaths && item.activePaths.some(path => pathname === path || pathname?.startsWith(path + '/')))
                const showBadge = item.badge && (
                  item.href === '/admin/maintenance' ? pendingCount > 0 :
                    item.href === '/admin/community' ? pendingPostsCount > 0 :
                      item.href === '/admin/renewals' ? pendingRenewalsCount > 0 :
                        false
                ) || (item.href === '/admin/messages' && unreadMessagesCount > 0)
                const badgeCount = item.href === '/admin/maintenance' ? pendingCount :
                  item.href === '/admin/community' ? pendingPostsCount :
                    item.href === '/admin/renewals' ? pendingRenewalsCount :
                      item.href === '/admin/messages' ? unreadMessagesCount : 0

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
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                    )}

                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={
                        isAiItem && !isActive
                          ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#ffffff' }
                          : {
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-tertiary)',
                            color: isActive ? '#ffffff' : 'var(--text-secondary)'
                          }
                      }
                    >
                      <Icon size={18} />
                    </div>

                    {/* Label */}
                    <span className="flex-1 text-sm font-semibold">
                      {item.label}
                    </span>

                    {/* AI Badge */}
                    {isAiItem && !isActive && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{ background: 'linear-gradient(135deg, #6366f120, #a855f720)', color: '#8b5cf6' }}
                      >
                        AI
                      </span>
                    )}

                    {/* Badge */}
                    {showBadge && (
                      <span
                        className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{
                          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : '#ef4444'
                        }}
                      >
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* System Menu */}
          <div
            className="pt-5"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          >
            <p
              className="px-3 mb-3 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Hệ thống
            </p>
            <div className="space-y-1">
              {systemItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
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
        </nav>

        {/* User & Building Section */}
        <div
          className="p-4 space-y-4"
          style={{
            borderTop: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-tertiary)'
          }}
        >
          {/* User Card */}
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border shadow-sm"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
              {user.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {user.fullName || 'Admin User'}
              </p>
              <p className="text-[10px] font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>
                {user.email || 'admin@ezhome.vn'}
              </p>
            </div>
          </div>

          {/* Building & Logout Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedBuildingId(null)
                  router.push('/admin')
                }}
                className="flex-1 h-10 bg-primary border border-primary rounded-xl px-3 text-xs font-bold cursor-pointer transition-all hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
                title="Đổi toà nhà"
              >
                <Building2 size={14} className="flex-shrink-0 text-blue-500" />
                <span className="truncate flex-1 text-left">
                  {selectedBuildingId
                    ? buildings.find(b => b.id === selectedBuildingId)?.name || 'Chọn toà nhà'
                    : 'Chọn toà nhà'}
                </span>
                <ChevronRight size={14} className="flex-shrink-0 text-tertiary" />
              </button>

              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90 flex-shrink-0"
              >
                <LogOut size={18} />
              </button>
            </div>

            <p className="text-[9px] font-medium text-center uppercase tracking-widest opacity-40 px-2" style={{ color: 'var(--text-tertiary)' }}>
              {selectedBuildingId ? `Đang quản lý: ${buildings.find(b => b.id === selectedBuildingId)?.name}` : 'Chưa chọn toà nhà'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Seamless with sidebar */}
        <header
          className="h-16 px-2 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-primary)',
            borderLeft: '1px solid var(--border-primary)'
          }}
        >
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs - hidden on mobile */}
            <nav className="hidden sm:flex items-center gap-2 overflow-hidden">
              <Link
                href="/admin"
                className="text-[11px] font-bold uppercase tracking-wider text-tertiary hover:text-primary transition-colors whitespace-nowrap"
              >
                ADMIN
              </Link>
              {getBreadcrumbs().map((crumb, idx) => (
                <div key={crumb.href} className="flex items-center gap-2 min-w-0">
                  <ChevronRight size={12} className="text-tertiary shrink-0" />
                  <Link
                    href={crumb.href}
                    className={`text-[11px] font-bold uppercase tracking-wider transition-colors truncate ${crumb.isLast ? 'text-primary' : 'text-tertiary hover:text-primary'
                      }`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Header Date */}
            <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-tertiary/50 border border-primary shadow-sm">
              <ClockIcon size={12} className="text-tertiary flex-shrink-0 sm:hidden" />
              <ClockIcon size={14} className="text-tertiary flex-shrink-0 hidden sm:block" />
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-secondary whitespace-nowrap">
                {formatHeaderDate()}
              </span>
            </div>
            <div className="lg:hidden">
              <DarkModeToggle />
            </div>
            <Link
              href="/admin/notifications"
              className="relative p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Bell size={18} className="sm:hidden" />
              <Bell size={20} className="hidden sm:block" />
              {unreadNotificationsCount > 0 && (
                <span
                  className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full border-2"
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
        <main
          className={`flex-1 overflow-y-auto ${pathname === '/admin/messages' || pathname === '/admin/notifications' || pathname === '/admin/ai-assistant' ? '' : 'p-6'}`}
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BuildingProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </BuildingProvider>
  )
}
