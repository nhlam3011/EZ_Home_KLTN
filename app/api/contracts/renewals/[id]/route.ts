import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Approve or reject renewal request (for admin)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { requestId, action, adminNote } = body // action: 'APPROVE' or 'REJECT'

        if (!requestId || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            )
        }

        // Find the renewal request
        const renewalRequest = await prisma.contractRenewalRequest.findUnique({
            where: { id: requestId },
            include: {
                contract: true
            }
        })

        if (!renewalRequest) {
            return NextResponse.json(
                { error: 'Renewal request not found' },
                { status: 404 }
            )
        }

        if (renewalRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'This request has already been processed' },
                { status: 400 }
            )
        }

        // Update the renewal request status
        const updatedRequest = await prisma.contractRenewalRequest.update({
            where: { id: requestId },
            data: {
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                adminNote: adminNote || null,
                processedAt: new Date()
            }
        })

        // If approved, update the contract end date
        if (action === 'APPROVE') {
            await prisma.contract.update({
                where: { id: renewalRequest.contractId },
                data: {
                    endDate: renewalRequest.newEndDate
                }
            })
        }

        return NextResponse.json({
            success: true,
            request: updatedRequest,
            message: action === 'APPROVE' ? 'Renewal request approved' : 'Renewal request rejected'
        })
    } catch (error) {
        console.error('Error processing renewal request:', error)
        return NextResponse.json(
            { error: 'Failed to process renewal request' },
            { status: 500 }
        )
    }
}
