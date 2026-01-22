import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const roomId = parseInt(resolvedParams.id)
    
    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      )
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        contracts: {
          include: {
            user: true,
            occupants: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        assets: true,
        issues: true
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room' },
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
    const roomId = parseInt(resolvedParams.id)
    
    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, floor, price, area, maxPeople, status, roomType, description, amenities } = body

    // Check if room exists first
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (floor) updateData.floor = parseInt(floor)
    if (price) updateData.price = parseFloat(price)
    if (area !== undefined) updateData.area = area ? parseFloat(area) : null
    if (maxPeople) updateData.maxPeople = parseInt(maxPeople)
    if (status) updateData.status = status
    if (roomType !== undefined) updateData.roomType = roomType || null
    if (description !== undefined) updateData.description = description || null
    if (amenities !== undefined) updateData.amenities = Array.isArray(amenities) ? amenities : []

    const room = await prisma.room.update({
      where: { id: roomId },
      data: updateData
    })

    return NextResponse.json(room)
  } catch (error: any) {
    console.error('Error updating room:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
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
      { error: error.message || 'Failed to update room' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const roomId = parseInt(resolvedParams.id)
    
    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      )
    }

    // Check if room has active contracts
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        contracts: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.contracts.length > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa phòng đang có hợp đồng hoạt động. Vui lòng chấm dứt hợp đồng trước.' },
        { status: 400 }
      )
    }

    await prisma.room.delete({
      where: { id: roomId }
    })

    return NextResponse.json({ success: true, message: 'Xóa phòng thành công' })
  } catch (error: any) {
    console.error('Error deleting room:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
}
