import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Admin directly extends/renews a contract for a user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { contractId, newEndDate, adminNote } = body

        if (!contractId || !newEndDate) {
            return NextResponse.json(
                { error: 'Missing required fields: contractId and newEndDate are required' },
                { status: 400 }
            )
        }

        // Check if contract exists
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                user: true,
                room: true
            }
        })

        if (!contract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            )
        }

        // Update the contract end date
        const updatedContract = await prisma.contract.update({
            where: { id: contractId },
            data: {
                endDate: new Date(newEndDate)
            },
            include: {
                user: true,
                room: true
            }
        })

        // Create a renewal record for tracking (automatically approved by admin)
        const renewalRecord = await prisma.contractRenewalRequest.create({
            data: {
                contractId,
                userId: contract.userId,
                newEndDate: new Date(newEndDate),
                status: 'APPROVED',
                adminNote: adminNote || 'Admin gia hạn trực tiếp',
                processedAt: new Date()
            },
            include: {
                user: true,
                contract: {
                    include: {
                        room: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Hợp đồng đã được gia hạn thành công',
            contract: updatedContract,
            renewal: renewalRecord
        })
    } catch (error) {
        console.error('Error extending contract:', error)
        return NextResponse.json(
            { error: 'Failed to extend contract' },
            { status: 500 }
        )
    }
}
