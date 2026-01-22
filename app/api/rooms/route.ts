import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const floor = searchParams.get('floor')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (floor && floor !== 'all') {
      where.floor = parseInt(floor)
    }
    
    // Note: We'll filter by search term after fetching to support nested relation search
    const rooms = await prisma.room.findMany({
      where,
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            user: true,
            occupants: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Filter by search term if provided (search in room name or tenant name)
    let filteredRooms = rooms
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRooms = rooms.filter(room => {
        // Search in room name
        if (room.name.toLowerCase().includes(searchLower)) {
          return true
        }
        // Search in tenant names (contracts)
        if (room.contracts && room.contracts.length > 0) {
          return room.contracts.some(contract => {
            // Search in main tenant name
            if (contract.user.fullName.toLowerCase().includes(searchLower)) {
              return true
            }
            // Search in occupant names
            if (contract.occupants && contract.occupants.length > 0) {
              return contract.occupants.some(occupant => 
                occupant.fullName.toLowerCase().includes(searchLower)
              )
            }
            return false
          })
        }
        return false
      })
    }

    return NextResponse.json(filteredRooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, floor, price, area, maxPeople, status, roomType, description, amenities } = body

    // Validate required fields
    if (!name || !floor || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if room name already exists
    const existingRoom = await prisma.room.findUnique({
      where: { name }
    })

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room name already exists' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        name,
        floor: parseInt(floor),
        price: parseFloat(price),
        area: area ? parseFloat(area) : null,
        maxPeople: maxPeople ? parseInt(maxPeople) : 1,
        status: status || 'AVAILABLE',
        roomType: roomType || null,
        description: description || null,
        amenities: amenities && Array.isArray(amenities) ? amenities : []
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    console.error('Error creating room:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên phòng đã tồn tại' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2011') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ. Có thể do database schema chưa được cập nhật.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    )
  }
}
