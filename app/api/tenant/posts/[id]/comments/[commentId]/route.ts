import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await params
    const postId = parseInt(resolvedParams.id)
    const commentId = parseInt(resolvedParams.commentId)
    if (isNaN(postId) || isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Try to get userId from the request (tenant might use query/body)
    const userId = request.nextUrl.searchParams.get('userId')
    const user = await getCurrentUser(request, userId ? parseInt(userId) : undefined)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.postId !== postId) {
      return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 })
    }

    // Only the author or an admin can delete the comment
    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await params
    const postId = parseInt(resolvedParams.id)
    const commentId = parseInt(resolvedParams.commentId)
    if (isNaN(postId) || isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { content, imageUrl, userId } = body

    if ((!content || !content.trim()) && !imageUrl) {
      return NextResponse.json({ error: 'Content or image required' }, { status: 400 })
    }

    const user = await getCurrentUser(request, userId ? parseInt(userId.toString()) : undefined)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true }
    })

    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    if (comment.postId !== postId) return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 })

    const isCommentAuthor = comment.userId === user.id
    const isPostAuthor = comment.post.userId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content !== undefined ? content.trim() : comment.content,
        imageUrl: imageUrl !== undefined ? imageUrl : comment.imageUrl
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

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}
