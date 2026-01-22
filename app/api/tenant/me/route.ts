import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') // Get userId from query params

    // Get current tenant user from authentication
    const tenantUser = await getCurrentUser(request, userId ? parseInt(userId) : undefined)

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as tenant.' },
        { status: 401 }
      )
    }

    if (tenantUser.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Only tenant users can access this endpoint' },
        { status: 403 }
      )
    }

    // Get user with contracts
    const user = await prisma.user.findUnique({
      where: { id: tenantUser.id },
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
