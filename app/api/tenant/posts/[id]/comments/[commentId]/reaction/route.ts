import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await params
    const commentId = parseInt(resolvedParams.commentId)
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { userId, type = 'LIKE' } = body

    const user = await getCurrentUser(request, userId)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: user.id
        }
      }
    })

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off
        await prisma.commentReaction.deleteMany({
          where: { id: existingReaction.id }
        })
        return NextResponse.json({ reacted: false })
      } else {
        // Change reaction type
        const updated = await prisma.commentReaction.updateMany({
          where: { id: existingReaction.id },
          data: { type }
        })
        return NextResponse.json({ reacted: true, reaction: updated })
      }
    } else {
      // Add reaction
      const newReaction = await prisma.commentReaction.create({
        data: {
          commentId,
          userId: user.id,
          type
        }
      })
      return NextResponse.json({ reacted: true, reaction: newReaction })
    }
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    )
  }
}
