import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all buildings with optional search
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (status && status !== 'ALL') {
            where.status = status
        }

        const [buildings, total] = await Promise.all([
            prisma.building.findMany({
                where,
                include: {
                    rooms: {
                        select: {
                            id: true,
                            status: true
                        }
                    },
                    _count: {
                        select: {
                            rooms: true,
                            ownerContracts: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.building.count({ where })
        ])

        // Calculate stats for each building
        const buildingsWithStats = buildings.map(building => {
            const totalRooms = building.rooms.length
            const rentedRooms = building.rooms.filter(r => r.status === 'RENTED').length
            const availableRooms = building.rooms.filter(r => r.status === 'AVAILABLE').length

            return {
                ...building,
                totalRooms,
                rentedRooms,
                availableRooms,
                rooms: undefined // Remove detailed rooms from response
            }
        })

        return NextResponse.json({
            buildings: buildingsWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching buildings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch buildings' },
            { status: 500 }
        )
    }
}

// POST - Create a new building
export async function POST(request: NextRequest) {
    let body: any
    try {
        body = await request.json()
        const {
            name,
            address,
            buildingType,
            floorCount = 1,
            totalRooms = 0,
            area,
            description,
            images = [],
            thumbnailUrl,
            status = 'ACTIVE',
            electricityPrice = 3500,
            waterPrice = 25000,
            servicePrice = 50000,
            roomTypePresets = []
        } = body

        if (!name || !address) {
            return NextResponse.json(
                { error: 'Name and address are required' },
                { status: 400 }
            )
        }

        const building = await prisma.building.create({
            data: ({
                name,
                address,
                buildingType: buildingType || 'NHÀ_PHỐ',
                floorCount,
                totalRooms,
                area,
                description,
                images,
                thumbnailUrl,
                status,
                isActive: status === 'ACTIVE',
                electricityPrice: electricityPrice || 3500,
                waterPrice: waterPrice || 25000,
                servicePrice: servicePrice || 50000,
                roomTypePresets: roomTypePresets || []
            } as any)
        })

        return NextResponse.json({ building }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating building:', error)
        console.error('Request body:', body)
        return NextResponse.json(
            { error: error.message || 'Failed to create building' },
            { status: 500 }
        )
    }
}
