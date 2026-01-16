import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' }
    })

    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    // Count notifications from Post table where content contains [Hóa đơn
    const count = await prisma.post.count({
      where: {
        userId: user.id,
        content: {
          contains: '[Hóa đơn'
        },
        status: 'PUBLIC'
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error counting notifications:', error)
    return NextResponse.json({ count: 0 })
  }
}
