import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'all', 'PENDING', 'PUBLIC'
    const search = searchParams.get('search')

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
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
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
    const { content, images, status, userId } = body

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
        status: status || 'PUBLIC' // Admin posts are automatically public
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            email: true
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
