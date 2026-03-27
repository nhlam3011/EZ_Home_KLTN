import { Metadata } from 'next'
import TenantLayoutClient from './TenantLayoutClient'

export const metadata: Metadata = {
  title: 'Tenant Dashboard',
  description: 'Cổng thông tin dành cho cư dân EZ-Home - Quản lý phòng, hóa đơn và dịch vụ tiện ích.',
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TenantLayoutClient>{children}</TenantLayoutClient>
}
