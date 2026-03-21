import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all owner contracts with optional filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status')
        const buildingId = searchParams.get('buildingId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}

        if (search) {
            where.OR = [
                { owner: { fullName: { contains: search, mode: 'insensitive' } } },
                { owner: { phone: { contains: search } } },
                { building: { name: { contains: search, mode: 'insensitive' } } },
                { building: { address: { contains: search, mode: 'insensitive' } } }
            ]
        }

        if (status && status !== 'ALL') {
            where.status = status
        }

        if (buildingId) {
            where.buildingId = parseInt(buildingId)
        }

        const [contracts, total] = await Promise.all([
            prisma.ownerContract.findMany({
                where,
                include: {
                    owner: {
                        select: {
                            id: true,
                            fullName: true,
                            phone: true,
                            email: true
                        }
                    },
                    building: {
                        select: {
                            id: true,
                            name: true,
                            address: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.ownerContract.count({ where })
        ])

        return NextResponse.json({
            contracts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching owner contracts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch owner contracts' },
            { status: 500 }
        )
    }
}

// POST - Create a new owner contract
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            ownerId,
            ownerName,
            ownerPhone,
            ownerEmail,
            buildingId,
            contractType = 'THUÊ_TOÀN_BỘ',
            monthlyRent,
            deposit,
            commission = 10,
            startDate,
            endDate,
            contractUrl,
            notes
        } = body

        if (!buildingId || !monthlyRent || !startDate) {
            return NextResponse.json(
                { error: 'Tòa nhà, tiền thuê và ngày bắt đầu là bắt buộc' },
                { status: 400 }
            )
        }

        const parsedBuildingId = parseInt(buildingId.toString())
        const numericMonthlyRent = parseFloat(monthlyRent.toString())
        const numericDeposit = deposit ? parseFloat(deposit.toString()) : 0
        const numericCommission = commission ? parseFloat(commission.toString()) : 10

        if (isNaN(parsedBuildingId) || isNaN(numericMonthlyRent)) {
            return NextResponse.json(
                { error: 'Dữ liệu không hợp lệ (ID tòa nhà hoặc Tiền thuê)' },
                { status: 400 }
            )
        }

        // Check if building exists
        const building = await prisma.building.findUnique({
            where: { id: parsedBuildingId }
        })

        if (!building) {
            return NextResponse.json(
                { error: 'Không tìm thấy tòa nhà' },
                { status: 404 }
            )
        }

        // Find or create owner
        let ownerIdToUse = ownerId

        if (!ownerIdToUse) {
            // Need to find by phone or create new owner
            if (!ownerName || !ownerPhone) {
                return NextResponse.json(
                    { error: 'Owner name and phone are required' },
                    { status: 400 }
                )
            }

            // Check if user exists by phone
            let owner = await prisma.user.findUnique({
                where: { phone: ownerPhone }
            })

            if (!owner) {
                // Create new user as owner
                owner = await prisma.user.create({
                    data: {
                        phone: ownerPhone,
                        fullName: ownerName,
                        email: ownerEmail || null,
                        password: 'OWNER_' + Date.now(), // Temporary password, should be changed
                        role: 'TENANT' // Default role, can be changed by admin
                    }
                })
            }
            ownerIdToUse = owner.id
        } else {
            // Verify owner exists
            const owner = await prisma.user.findUnique({
                where: { id: ownerIdToUse }
            })
            if (!owner) {
                return NextResponse.json(
                    { error: 'Owner not found' },
                    { status: 404 }
                )
            }
        }

        // Check if there's already an active contract for this building
        const existingContract = await prisma.ownerContract.findFirst({
            where: {
                buildingId: parsedBuildingId,
                status: 'ACTIVE'
            }
        })

        if (existingContract) {
            return NextResponse.json(
                { error: 'Tòa nhà đã có hợp đồng đang hoạt động. Vui lòng chấm dứt hợp đồng cũ trước khi tạo mới.' },
                { status: 400 }
            )
        }

        const ownerContract = await prisma.ownerContract.create({
            data: {
                ownerId: ownerIdToUse,
                buildingId: parsedBuildingId,
                contractType,
                monthlyRent: numericMonthlyRent,
                deposit: numericDeposit,
                commission: numericCommission,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                contractUrl,
                notes,
                status: 'ACTIVE'
            }
        })

        return NextResponse.json({ contract: ownerContract }, { status: 201 })
    } catch (error) {
        console.error('Error creating owner contract:', error)
        return NextResponse.json(
            { error: 'Failed to create owner contract' },
            { status: 500 }
        )
    }
}
