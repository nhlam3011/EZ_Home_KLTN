import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get building by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const buildingId = parseInt(id)

        if (isNaN(buildingId)) {
            return NextResponse.json(
                { error: 'Invalid building ID' },
                { status: 400 }
            )
        }

        const building = await prisma.building.findUnique({
            where: { id: buildingId },
            include: {
                rooms: {
                    include: {
                        contracts: {
                            where: { status: 'ACTIVE' },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        phone: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { floor: 'asc' }
                },
                ownerContracts: {
                    where: { status: 'ACTIVE' },
                    include: {
                        owner: {
                            select: {
                                id: true,
                                fullName: true,
                                phone: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { startDate: 'desc' }
                },
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        contract: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!building) {
            return NextResponse.json(
                { error: 'Building not found' },
                { status: 404 }
            )
        }

        // Calculate stats
        const totalRooms = building.rooms.length
        const rentedRooms = building.rooms.filter(r => r.status === 'RENTED').length
        const availableRooms = building.rooms.filter(r => r.status === 'AVAILABLE').length
        const maintenanceRooms = building.rooms.filter(r => r.status === 'MAINTENANCE').length

        // Calculate revenue from invoices
        const totalRevenue = building.invoices
            .filter(inv => inv.status === 'PAID')
            .reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

        return NextResponse.json({
            building: {
                ...building,
                stats: {
                    totalRooms,
                    rentedRooms,
                    availableRooms,
                    maintenanceRooms,
                    totalRevenue
                }
            }
        })
    } catch (error) {
        console.error('Error fetching building:', error)
        return NextResponse.json(
            { error: 'Failed to fetch building' },
            { status: 500 }
        )
    }
}

// PUT - Update building
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let body: any
    try {
        const { id } = await params
        const buildingId = parseInt(id)

        if (isNaN(buildingId)) {
            return NextResponse.json(
                { error: 'Invalid building ID' },
                { status: 400 }
            )
        }

        body = await request.json()
        const {
            name,
            address,
            buildingType,
            floorCount,
            totalRooms,
            area,
            description,
            images,
            thumbnailUrl,
            status,
            roomTypePresets
        } = body

        const updateData: any = {}
        if (name) updateData.name = name
        if (address) updateData.address = address
        if (buildingType) updateData.buildingType = buildingType
        if (floorCount !== undefined) updateData.floorCount = floorCount
        if (totalRooms !== undefined) updateData.totalRooms = totalRooms
        if (area !== undefined) updateData.area = area
        if (description !== undefined) updateData.description = description
        if (images) updateData.images = images
        if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
        if (status) {
            updateData.status = status
            updateData.isActive = status === 'ACTIVE'
        }
        if (roomTypePresets !== undefined) {
            updateData.roomTypePresets = roomTypePresets
        }

        const building = await prisma.building.update({
            where: { id: buildingId },
            data: updateData as any
        })

        return NextResponse.json({ building })
    } catch (error: any) {
        console.error('Error updating building:', error)
        console.error('Request body:', body)
        return NextResponse.json(
            { error: error.message || 'Failed to update building' },
            { status: 500 }
        )
    }
}

// DELETE - Delete building (soft delete - just set inactive)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const buildingId = parseInt(id)

        if (isNaN(buildingId)) {
            return NextResponse.json(
                { error: 'Invalid building ID' },
                { status: 400 }
            )
        }

        // Soft delete - just set inactive
        const building = await prisma.building.update({
            where: { id: buildingId },
            data: {
                status: 'INACTIVE',
                isActive: false
            }
        })

        return NextResponse.json({
            message: 'Building deleted successfully',
            building
        })
    } catch (error) {
        console.error('Error deleting building:', error)
        return NextResponse.json(
            { error: 'Failed to delete building' },
            { status: 500 }
        )
    }
}
