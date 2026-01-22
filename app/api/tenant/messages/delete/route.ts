import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// DELETE /api/tenant/messages/delete - Xóa tất cả tin nhắn với admin
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') // Tenant user ID từ query

    // Get current tenant user
    const tenantUser = await getCurrentUser(request, userId ? parseInt(userId) : undefined)

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as tenant.' },
        { status: 401 }
      )
    }

    if (tenantUser.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Only tenant users can delete messages' },
        { status: 403 }
      )
    }

    // Lấy admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Xóa tất cả tin nhắn giữa tenant và admin
    const deleted = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: tenantUser.id, receiverId: adminUser.id },
          { senderId: adminUser.id, receiverId: tenantUser.id }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count
    })
  } catch (error) {
    console.error('Error deleting messages:', error)
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    )
  }
}
