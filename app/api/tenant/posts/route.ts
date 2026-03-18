import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    // Default visibility for tenant feed
    if (status === 'all') {
      // For "My Posts" tab, show all statuses if userId is provided
      if (userId) {
        where.userId = parseInt(userId)
      }
    } else {
      where.status = 'PUBLIC'
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    // Filter out internal invoice notifications
    where.NOT = {
      content: {
        startsWith: '[Hóa đơn #'
      }
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
            contracts: {
              where: { status: 'ACTIVE' },
              include: { room: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, images, userId, category } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get current tenant user from request
    const user = await getCurrentUser(request, userId)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      )
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content,
        images: images || [],
        category: category || 'DISCUSSION',
        status: user.role === 'ADMIN' ? 'PUBLIC' : 'PENDING'
      },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
            contracts: {
              where: { status: 'ACTIVE' },
              include: { room: { select: { name: true } } }
            }
          }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
