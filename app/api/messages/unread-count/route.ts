import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Get current tenant user
    const user = await getCurrentUser(request, userId ? parseInt(userId) : undefined)

    if (!user || user.role !== 'TENANT') {
      return NextResponse.json({ count: 0 })
    }

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return NextResponse.json({ count: 0 })
    }

    // Count unread messages from admin to tenant
    const count = await prisma.message.count({
      where: {
        senderId: adminUser.id,
        receiverId: user.id,
        isRead: false
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error counting unread messages:', error)
    return NextResponse.json({ count: 0 })
  }
}
