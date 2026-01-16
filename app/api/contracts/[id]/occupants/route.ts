import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lấy danh sách người ở trong hợp đồng
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const contractId = parseInt(resolvedParams.id)
    
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Invalid contract ID' },
        { status: 400 }
      )
    }

    const occupants = await prisma.contractOccupant.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(occupants)
  } catch (error) {
    console.error('Error fetching occupants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch occupants' },
      { status: 500 }
    )
  }
}

// POST - Thêm người ở vào hợp đồng
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const contractId = parseInt(resolvedParams.id)
    
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Invalid contract ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { fullName, cccdNumber, phone, dob, relationship } = body

    if (!fullName) {
      return NextResponse.json(
        { error: 'Tên người ở là bắt buộc' },
        { status: 400 }
      )
    }

    // Get contract to check room
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        occupants: true,
        room: true
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Hợp đồng không tồn tại' },
        { status: 404 }
      )
    }

    // Calculate total people (1 main tenant + current occupants + 1 new occupant)
    const totalPeople = 1 + contract.occupants.length + 1

    // Create occupant
    const occupant = await prisma.contractOccupant.create({
      data: {
        contractId,
        fullName,
        cccdNumber: cccdNumber || null,
        phone: phone || null,
        dob: dob ? new Date(dob) : null,
        relationship: relationship || null
      }
    })

    // Update room maxPeople if needed
    if (contract.room && totalPeople > contract.room.maxPeople) {
      await prisma.room.update({
        where: { id: contract.roomId },
        data: { maxPeople: totalPeople }
      })
    }

    return NextResponse.json(occupant, { status: 201 })
  } catch (error) {
    console.error('Error adding occupant:', error)
    return NextResponse.json(
      { error: 'Failed to add occupant' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa người ở khỏi hợp đồng
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const contractId = parseInt(resolvedParams.id)
    
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: 'Invalid contract ID' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const occupantId = searchParams.get('occupantId')

    if (!occupantId) {
      return NextResponse.json(
        { error: 'Occupant ID is required' },
        { status: 400 }
      )
    }

    // Delete occupant
    await prisma.contractOccupant.delete({
      where: { id: parseInt(occupantId) }
    })

    // Recalculate and update room maxPeople if needed
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        occupants: true,
        room: true
      }
    })

    if (contract && contract.room) {
      const totalPeople = 1 + contract.occupants.length
      // Only update if current maxPeople is higher than needed
      // Don't reduce maxPeople automatically to avoid issues
      // Admin can manually adjust if needed
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting occupant:', error)
    return NextResponse.json(
      { error: 'Failed to delete occupant' },
      { status: 500 }
    )
  }
}
