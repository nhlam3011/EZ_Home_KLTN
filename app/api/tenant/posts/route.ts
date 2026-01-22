import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    const where: any = {
      status: 'PUBLIC'
    }

    // Filter by type if provided
    // Note: You may need to add a 'type' field to Post model

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Add mock likes and comments
    const postsWithStats = posts.map(post => ({
      ...post,
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 10)
    }))

    return NextResponse.json(postsWithStats)
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
    const { content, images, userId } = body

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

    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Only tenant users can create posts' },
        { status: 403 }
      )
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        content,
        images: images || [],
        status: 'PENDING' // Bài viết cần được admin duyệt
      },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true
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
