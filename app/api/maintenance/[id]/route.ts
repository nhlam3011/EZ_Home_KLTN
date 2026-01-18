import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendIssueStatusUpdateEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const issueId = parseInt(resolvedParams.id)
    
    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: 'Invalid issue ID' },
        { status: 400 }
      )
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        user: true,
        room: true
      }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(issue)
  } catch (error) {
    console.error('Error fetching issue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { status, repairCost, adminNotes, cancelReason } = body
    const issueId = parseInt(resolvedParams.id)

    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: 'Invalid issue ID' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status.toUpperCase()
    }
    
    if (repairCost !== undefined && repairCost !== null && repairCost !== '') {
      const cost = typeof repairCost === 'string' ? parseFloat(repairCost) : repairCost
      updateData.repairCost = !isNaN(cost) ? cost : null
    } else if (repairCost === null || repairCost === '') {
      updateData.repairCost = null
    }

    // Get current issue to preserve original description
    const currentIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    })

    if (!currentIssue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    // Extract original description (before admin notes)
    const originalDesc = currentIssue.description.split('\n\n--- Admin Notes ---')[0].split('\n\n--- Lý do hủy ---')[0]

    // Handle cancellation reason
    if (status === 'CANCELLED' && cancelReason && cancelReason.trim()) {
      updateData.description = `${originalDesc}\n\n--- Lý do hủy ---\n${cancelReason.trim()}`
      // If there are admin notes, preserve them
      if (adminNotes && adminNotes.trim()) {
        const existingAdminNotes = currentIssue.description.includes('--- Admin Notes ---')
          ? currentIssue.description.split('--- Admin Notes ---\n')[1]?.split('\n\n--- Lý do hủy ---')[0] || ''
          : ''
        if (existingAdminNotes) {
          updateData.description = `${originalDesc}\n\n--- Admin Notes ---\n${existingAdminNotes}\n\n--- Lý do hủy ---\n${cancelReason.trim()}`
        }
      }
    } else {
      // Handle admin notes (normal case)
      if (adminNotes !== undefined) {
        if (adminNotes && adminNotes.trim()) {
          // Check if there's already a cancellation reason
          const hasCancelReason = currentIssue.description.includes('--- Lý do hủy ---')
          if (hasCancelReason) {
            const cancelReasonText = currentIssue.description.split('--- Lý do hủy ---\n')[1] || ''
            updateData.description = `${originalDesc}\n\n--- Admin Notes ---\n${adminNotes}\n\n--- Lý do hủy ---\n${cancelReasonText}`
          } else {
            updateData.description = `${originalDesc}\n\n--- Admin Notes ---\n${adminNotes}`
          }
        } else {
          // Remove admin notes but keep cancellation reason if exists
          const hasCancelReason = currentIssue.description.includes('--- Lý do hủy ---')
          if (hasCancelReason) {
            const cancelReasonText = currentIssue.description.split('--- Lý do hủy ---\n')[1] || ''
            updateData.description = `${originalDesc}\n\n--- Lý do hủy ---\n${cancelReasonText}`
          } else {
            updateData.description = originalDesc
          }
        }
      }
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            floor: true
          }
        }
      }
    })

    // Send email notification to tenant when issue status is updated
    if (status && updatedIssue.user.email) {
      const statusLabels: Record<string, string> = {
        PENDING: 'Đang chờ xử lý',
        PROCESSING: 'Đang xử lý',
        DONE: 'Đã hoàn thành',
        CANCELLED: 'Đã hủy'
      }
      
      const statusLabel = statusLabels[status.toUpperCase()] || status
      await sendIssueStatusUpdateEmail(
        updatedIssue.user.email,
        updatedIssue.title,
        status.toUpperCase(),
        statusLabel,
        updatedIssue.user.fullName
      )
    }

    return NextResponse.json(updatedIssue)
  } catch (error) {
    console.error('Error updating issue:', error)
    return NextResponse.json(
      { error: 'Failed to update issue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
