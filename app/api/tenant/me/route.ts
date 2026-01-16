import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This is a placeholder - in production, you'd get user ID from session/auth
export async function GET() {
  try {
    // For demo, get first tenant user
    // In production, get from session: const userId = await getUserId()
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            room: true
          },
          take: 1,
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...user,
      room: user.contracts[0]?.room || null
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
