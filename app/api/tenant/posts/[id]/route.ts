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
    const { content, images, category, userId, role } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check post existence and permission
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.userId !== userId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Tenants editing should require re-approval
    const status = role === 'ADMIN' ? 'PUBLIC' : 'PENDING'

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        content,
        images,
        category,
        status
      },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
            contracts: {
              include: {
                room: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })

    // Emit event for real-time updates
    communityEvents.emit(COMMUNITY_EVENTS.POST_UPDATED, { postId, type: 'EDIT' })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const postId = parseInt(resolvedParams.id)
    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get('userId') || '')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check post existence and permission
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.userId !== userId && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: postId }
    })

    // Emit event for real-time updates
    communityEvents.emit(COMMUNITY_EVENTS.POST_DELETED, { postId })

    return NextResponse.json({ message: 'Post deleted' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
