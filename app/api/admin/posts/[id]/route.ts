import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { communityEvents, COMMUNITY_EVENTS } from '@/lib/events'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const postId = parseInt(resolvedParams.id)
    const body = await request.json()
    const { status, content, images, category } = body

    const data: any = {}
    if (status) data.status = status
    if (content) data.content = content
    if (images) data.images = images
    if (category) data.category = category

    const post = await prisma.post.update({
      where: { id: postId },
      data,
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


    // Emit event for real-time updates
    if (status === 'PUBLIC') {
        communityEvents.emit(COMMUNITY_EVENTS.POST_CREATED, { postId })
    } else {
        communityEvents.emit(COMMUNITY_EVENTS.POST_UPDATED, { postId, type: 'STATUS_UPDATE' })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const postId = parseInt(resolvedParams.id)

    await prisma.post.delete({
      where: { id: postId }
    })

    // Emit event for real-time updates
    communityEvents.emit(COMMUNITY_EVENTS.POST_DELETED, { postId })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
