import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const issueId = parseInt(resolvedParams.id)
    const body = await request.json()
    const { rating } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    if (issue.status !== 'DONE') {
      return NextResponse.json(
        { error: 'Can only rate completed issues' },
        { status: 400 }
      )
    }

    // In a real app, this would save to a ratings table
    // For now, we'll just log it
    console.log('Issue rating:', {
      issueId,
      rating,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá!'
    })
  } catch (error) {
    console.error('Error rating issue:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}
