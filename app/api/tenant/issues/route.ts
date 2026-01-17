import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMessageNotificationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

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

    const where: any = {
      userId: user.id
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        room: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Add mock data for severity and category
    const issuesWithExtras = issues.map(issue => ({
      ...issue,
      severity: issue.status === 'PENDING' ? 'HIGH' : issue.status === 'PROCESSING' ? 'MEDIUM' : 'LOW',
      category: issue.title.includes('điều hòa') ? 'Điện & Máy lạnh' :
                issue.title.includes('đèn') ? 'Điện dân dụng' :
                issue.title.includes('nước') ? 'Nước & Vệ sinh' :
                issue.title.includes('Internet') ? 'Dịch vụ mạng' : 'Khác',
      progress: issue.status === 'DONE' ? 100 : issue.status === 'PROCESSING' ? 80 : 0
    }))

    return NextResponse.json(issuesWithExtras)
  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, images, roomId, severity, category } = body

    // Get first tenant user (in production, get from session)
    const user = await prisma.user.findFirst({
      where: { role: 'TENANT' },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const contract = user.contracts[0]
    if (!contract) {
      return NextResponse.json(
        { error: 'No active contract found' },
        { status: 400 }
      )
    }

    // Validate images array
    const validImages = Array.isArray(images) ? images.filter(img => img && typeof img === 'string') : []

    const issue = await prisma.issue.create({
      data: {
        userId: user.id,
        roomId: contract.roomId,
        title,
        description,
        images: validImages,
        status: 'PENDING'
      },
      include: {
        room: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    // Send email confirmation to tenant
    if (issue.user.email) {
      sendMessageNotificationEmail(issue.user.email, {
        title: `Xác nhận yêu cầu: ${issue.title}`,
        content: `Yêu cầu của bạn đã được ghi nhận và đang chờ xử lý.\n\nChi tiết:\n- Phòng: ${issue.room.name}\n- Mô tả: ${description}\n- Trạng thái: Đang chờ xử lý\n\nChúng tôi sẽ liên hệ với bạn sớm nhất có thể.`,
        from: 'EZ-Home Admin',
        type: 'notification'
      }).catch(err => {
        console.error('Failed to send issue confirmation email:', err)
      })
    }

    // Add mock data for severity and category
    const issueWithExtras = {
      ...issue,
      severity: severity || 'MEDIUM',
      category: category || '',
      progress: 0
    }

    return NextResponse.json(issueWithExtras, { status: 201 })
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}
