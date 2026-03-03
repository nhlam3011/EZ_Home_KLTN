import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all renewal requests (for admin) or filter by userId (for tenant)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status')
        const userId = searchParams.get('userId')

        const where: any = {}
        if (status && status !== 'all') {
            where.status = status
        }

        // If userId is provided, filter by userId (for tenant)
        if (userId) {
            where.userId = parseInt(userId)
        }

        let requests: any[] = []
        try {
            requests = await prisma.contractRenewalRequest.findMany({
                where,
                include: {
                    contract: {
                        include: {
                            user: true,
                            room: true
                        }
                    },
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        } catch (dbError) {
            console.error('Database error fetching renewal requests:', dbError)
            // Return empty array if table doesn't exist yet
            return NextResponse.json({ renewals: [] })
        }

        return NextResponse.json({ renewals: requests })
    } catch (error) {
        console.error('Error fetching renewal requests:', error)
        return NextResponse.json(
            { error: 'Failed to fetch renewal requests' },
            { status: 500 }
        )
    }
}

// POST - Create a new renewal request (for tenant)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { contractId, newEndDate, userId } = body

        if (!contractId || !newEndDate || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if contract exists and is active
        const contract = await prisma.contract.findUnique({
            where: { id: contractId }
        })

        if (!contract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            )
        }

        if (contract.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Contract is not active' },
                { status: 400 }
            )
        }

        // Check if there's already a pending request
        try {
            const existingRequest = await prisma.contractRenewalRequest.findFirst({
                where: {
                    contractId,
                    status: 'PENDING'
                }
            })

            if (existingRequest) {
                return NextResponse.json(
                    { error: 'There is already a pending renewal request for this contract' },
                    { status: 400 }
                )
            }
        } catch (dbError) {
            console.error('Database error checking existing request:', dbError)
            // Continue if table doesn't exist yet
        }

        // Create the renewal request
        let renewalRequest
        try {
            renewalRequest = await prisma.contractRenewalRequest.create({
                data: {
                    contractId,
                    userId,
                    newEndDate: new Date(newEndDate),
                    status: 'PENDING'
                },
                include: {
                    contract: {
                        include: {
                            user: true,
                            room: true
                        }
                    }
                }
            })
        } catch (dbError) {
            console.error('Database error creating renewal request:', dbError)
            return NextResponse.json(
                { error: 'Failed to create renewal request. Table may not exist yet.' },
                { status: 500 }
            )
        }

        if (!renewalRequest) {
            return NextResponse.json(
                { error: 'Failed to create renewal request' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            renewals: renewalRequest,
            message: 'Renewal request submitted successfully'
        })
    } catch (error) {
        console.error('Error creating renewal request:', error)
        return NextResponse.json(
            { error: 'Failed to create renewal request' },
            { status: 500 }
        )
    }
}
