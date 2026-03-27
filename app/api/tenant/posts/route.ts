import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { communityEvents, COMMUNITY_EVENTS } from '@/lib/events'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const buildingId = searchParams.get('buildingId')

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

    if (buildingId) {
      where.buildingId = parseInt(buildingId)
    } else if (userId) {
      // If we're looking at someone else's feed or our own feed, 
      // we might want global posts too, but usually it's per building
      const userContracts = await prisma.contract.findMany({
        where: { userId: parseInt(userId), status: 'ACTIVE' },
        include: { room: true }
      })
      const buildingIds = userContracts.map(c => c.room.buildingId).filter(Boolean) as number[]
      
      where.OR = [
        { buildingId: { in: buildingIds } },
        { buildingId: null }
      ]
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        content: true,
        images: true,
        category: true,
        status: true,
        createdAt: true,
        buildingId: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            contracts: {
              where: { status: 'ACTIVE' },
              select: { room: { select: { name: true } } },
              take: 1
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        ...(userId ? {
          likes: {
            where: { userId: parseInt(userId) },
            select: { userId: true },
            take: 1
          }
        } : {})
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const formattedPosts = posts.map(post => {
      const { _count, likes, ...rest } = post as any
      return {
        ...rest,
        likes: _count?.likes || 0,
        comments: _count?.comments || 0,
        isLiked: likes && likes.length > 0
      }
    })

    return NextResponse.json(formattedPosts)
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

    // Get user's current building
    const activeContract = await prisma.contract.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { room: { select: { buildingId: true } } }
    })
    const userBuildingId = activeContract?.room?.buildingId

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content,
        images: images || [],
        category: category || 'DISCUSSION',
        status: user.role === 'ADMIN' ? 'PUBLIC' : 'PENDING',
        buildingId: userBuildingId
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

    // Emit event for real-time updates
    communityEvents.emit(COMMUNITY_EVENTS.POST_CREATED, { postId: post.id })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
