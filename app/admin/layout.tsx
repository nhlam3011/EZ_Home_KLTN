import { Metadata } from 'next'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Bảng điều khiển quản lý hệ thống EZ-Home dành cho quản trị viên.',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
