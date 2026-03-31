import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'all', 'PENDING', 'PUBLIC'
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const buildingId = searchParams.get('buildingId')

    const userId = searchParams.get('userId')

    const where: any = {
      // Filter out invoice notification posts (they start with "[Hóa đơn #")
      NOT: {
        content: {
          startsWith: '[Hóa đơn #'
        }
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (buildingId && buildingId !== 'all') {
      where.buildingId = parseInt(buildingId)
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
            avatarUrl: true
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
      take: limit,
      skip: skip
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
    const { content, images, status, userId, category, buildingId } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get current admin user from request
    const adminUser = await getCurrentUser(request, userId)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as admin.' },
        { status: 401 }
      )
    }

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin users can create posts' },
        { status: 403 }
      )
    }

    const post = await prisma.post.create({
      data: {
        userId: adminUser.id,
        content,
        images: images || [],
        category: category || 'ANNOUNCEMENT',
        status: status || 'PUBLIC', // Admin posts are automatically public
        buildingId: buildingId ? parseInt(buildingId) : null
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            email: true,
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
