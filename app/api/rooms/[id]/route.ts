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
            user: true
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
    const { name, floor, price, area, maxPeople, status } = body

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

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(name && { name }),
        ...(floor && { floor: parseInt(floor) }),
        ...(price && { price: parseFloat(price) }),
        ...(area !== undefined && { area: area ? parseFloat(area) : null }),
        ...(maxPeople && { maxPeople: parseInt(maxPeople) }),
        ...(status && { status })
      }
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
    return NextResponse.json(
      { error: 'Failed to update room' },
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
