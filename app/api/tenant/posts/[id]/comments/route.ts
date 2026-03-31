import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { communityEvents, COMMUNITY_EVENTS } from '@/lib/events'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const postId = parseInt(resolvedParams.id)
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50') // Default limit of 50 for now, but usually frontend calls with 20
    const skip = parseInt(searchParams.get('skip') || '0')

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            contracts: {
              where: { status: 'ACTIVE' },
              select: {
                room: {
                  select: { name: true }
                }
              },
              take: 1
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: skip
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const postId = parseInt(resolvedParams.id)
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { content, imageUrl, userId, parentId } = body

    if ((!content || !content.trim()) && !imageUrl) {
      return NextResponse.json({ error: 'Comment must have content or image' }, { status: 400 })
    }

    const user = await getCurrentUser(request, userId)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        content: content ? content.trim() : '',
        imageUrl: imageUrl ? imageUrl : null,
        postId,
        userId: user.id,
        parentId: parentId ? parseInt(parentId) || null : null
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            contracts: {
              where: { status: 'ACTIVE' },
              include: { room: { select: { name: true } } }
            }
          }
        },
        reactions: true
      }
    })

    // Emit event for real-time updates
    communityEvents.emit(COMMUNITY_EVENTS.COMMENT_CREATED, { postId, commentId: comment.id, type: 'COMMENT' })
    communityEvents.emit(COMMUNITY_EVENTS.POST_UPDATED, { postId, type: 'COMMENT' })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
