import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { communityEvents, COMMUNITY_EVENTS } from '@/lib/events'

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
    const userId = body.userId

    const user = await getCurrentUser(request, userId)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id
        }
      }
    })

    if (existingLike) {
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      })
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId: user.id
        }
      })
    }

    // Emit event for real-time updates
    communityEvents.emit(COMMUNITY_EVENTS.POST_UPDATED, { postId, type: 'LIKE' })

    return NextResponse.json({ liked: !existingLike })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
