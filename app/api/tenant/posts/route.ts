import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const { content, images } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
