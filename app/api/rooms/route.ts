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
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

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

    return NextResponse.json(rooms)
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
    const { name, floor, price, area, maxPeople, status, description } = body

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
        status: status || 'AVAILABLE'
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
