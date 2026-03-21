import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get owner contract by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const contractId = parseInt(id)

        if (isNaN(contractId)) {
            return NextResponse.json(
                { error: 'Invalid contract ID' },
                { status: 400 }
            )
        }

        const contract = await prisma.ownerContract.findUnique({
            where: { id: contractId },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        cccdNumber: true,
                        address: true
                    }
                },
                building: {
                    include: {
                        rooms: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                                price: true
                            }
                        }
                    }
                }
            }
        })

        if (!contract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ contract })
    } catch (error) {
        console.error('Error fetching owner contract:', error)
        return NextResponse.json(
            { error: 'Failed to fetch owner contract' },
            { status: 500 }
        )
    }
}

// PUT - Update owner contract
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const contractId = parseInt(id)

        if (isNaN(contractId)) {
            return NextResponse.json(
                { error: 'Invalid contract ID' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const {
            ownerName,
            ownerPhone,
            ownerEmail,
            buildingId,
            contractType,
            monthlyRent,
            deposit,
            commission,
            endDate,
            contractUrl,
            notes,
            status
        } = body

        // 1. Get current contract to find ownerId
        const currentContract = await prisma.ownerContract.findUnique({
            where: { id: contractId }
        })

        if (!currentContract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            )
        }

        // 2. Update Owner info (User model)
        if (ownerName || ownerPhone || ownerEmail) {
            await prisma.user.update({
                where: { id: currentContract.ownerId },
                data: {
                    ...(ownerName && { fullName: ownerName }),
                    ...(ownerPhone && { phone: ownerPhone }),
                    ...(ownerEmail !== undefined && { email: ownerEmail })
                }
            })
        }

        // 3. Update Contract
        const contract = await prisma.ownerContract.update({
            where: { id: contractId },
            data: {
                ...(buildingId && { buildingId: parseInt(buildingId.toString()) }),
                ...(contractType && { contractType }),
                ...(monthlyRent !== undefined && { monthlyRent: parseFloat(monthlyRent.toString()) }),
                ...(deposit !== undefined && { deposit: parseFloat(deposit.toString()) }),
                ...(commission !== undefined && { commission: parseFloat(commission.toString()) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(contractUrl !== undefined && { contractUrl }),
                ...(notes !== undefined && { notes }),
                ...(status && { status })
            }
        })

        // If contract is terminated, remove current owner from building
        if (status === 'TERMINATED') {
            // Building owner removed
        }

        return NextResponse.json({ contract })
    } catch (error) {
        console.error('Error updating owner contract:', error)
        return NextResponse.json(
            { error: 'Failed to update owner contract' },
            { status: 500 }
        )
    }
}

// DELETE - Terminate owner contract (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const contractId = parseInt(id)

        if (isNaN(contractId)) {
            return NextResponse.json(
                { error: 'Invalid contract ID' },
                { status: 400 }
            )
        }

        // Get contract first to know the building
        const contract = await prisma.ownerContract.findUnique({
            where: { id: contractId }
        })

        if (!contract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            )
        }

        // Terminate contract
        const updatedContract = await prisma.ownerContract.update({
            where: { id: contractId },
            data: {
                status: 'TERMINATED'
            }
        })

        // Note: Building owner relationship is managed through OwnerContract

        return NextResponse.json({
            message: 'Contract terminated successfully',
            contract: updatedContract
        })
    } catch (error) {
        console.error('Error terminating owner contract:', error)
        return NextResponse.json(
            { error: 'Failed to terminate contract' },
            { status: 500 }
        )
    }
}
