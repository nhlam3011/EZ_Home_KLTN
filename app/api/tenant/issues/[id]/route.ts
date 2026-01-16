import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const issueId = parseInt(resolvedParams.id)

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

    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        userId: user.id // Ensure user can only see their own issues
      },
      include: {
        room: true
      }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    // Add mock data for severity and category
    const issueWithExtras = {
      ...issue,
      severity: issue.status === 'PENDING' ? 'HIGH' : issue.status === 'PROCESSING' ? 'MEDIUM' : 'LOW',
      category: issue.title.includes('điều hòa') || issue.title.includes('máy lạnh') ? 'Điện & Máy lạnh' :
                issue.title.includes('đèn') ? 'Điện dân dụng' :
                issue.title.includes('nước') ? 'Nước & Vệ sinh' :
                issue.title.includes('Internet') || issue.title.includes('mạng') ? 'Dịch vụ mạng' : 'Khác',
      progress: issue.status === 'DONE' ? 100 : issue.status === 'PROCESSING' ? 80 : 0
    }

    return NextResponse.json(issueWithExtras)
  } catch (error) {
    console.error('Error fetching issue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 }
    )
  }
}
