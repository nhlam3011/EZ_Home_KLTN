import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lấy danh sách meter readings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const roomId = searchParams.get('roomId')

    const where: any = {}
    
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (roomId) where.roomId = parseInt(roomId)

    const readings = await prisma.meterReading.findMany({
      where,
      include: {
        room: {
          include: {
            contracts: {
              where: { status: 'ACTIVE' },
              include: {
                user: true
              },
              take: 1
            }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { room: { name: 'asc' } }
      ]
    })

    return NextResponse.json(readings)
  } catch (error) {
    console.error('Error fetching meter readings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meter readings' },
      { status: 500 }
    )
  }
}

// POST - Tạo hoặc cập nhật meter reading
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, month, year, elecNew, waterNew } = body

    if (!roomId || !month || !year || elecNew === undefined || waterNew === undefined) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Get last month's reading to get old values
    let lastMonth = parseInt(month) - 1
    let lastYear = parseInt(year)
    if (lastMonth === 0) {
      lastMonth = 12
      lastYear -= 1
    }

    const lastReading = await prisma.meterReading.findFirst({
      where: {
        roomId: parseInt(roomId),
        month: lastMonth,
        year: lastYear
      },
      orderBy: { recordedDate: 'desc' }
    })

    const elecOld = lastReading ? lastReading.elecNew : 0
    const waterOld = lastReading ? lastReading.waterNew : 0

    // Validate: new reading must be >= old reading
    if (elecNew < elecOld) {
      return NextResponse.json(
        { error: `Chỉ số điện mới (${elecNew}) không được nhỏ hơn chỉ số cũ (${elecOld})` },
        { status: 400 }
      )
    }

    if (waterNew < waterOld) {
      return NextResponse.json(
        { error: `Chỉ số nước mới (${waterNew}) không được nhỏ hơn chỉ số cũ (${waterOld})` },
        { status: 400 }
      )
    }

    // Check if reading already exists for this period
    const existingReading = await prisma.meterReading.findFirst({
      where: {
        roomId: parseInt(roomId),
        month: parseInt(month),
        year: parseInt(year)
      }
    })

    if (existingReading) {
      // Update existing reading
      const updated = await prisma.meterReading.update({
        where: { id: existingReading.id },
        data: {
          elecOld,
          elecNew: parseFloat(elecNew),
          waterOld,
          waterNew: parseFloat(waterNew)
        }
      })
      return NextResponse.json(updated)
    } else {
      // Create new reading
      const reading = await prisma.meterReading.create({
        data: {
          roomId: parseInt(roomId),
          month: parseInt(month),
          year: parseInt(year),
          elecOld,
          elecNew: parseFloat(elecNew),
          waterOld,
          waterNew: parseFloat(waterNew)
        }
      })
      return NextResponse.json(reading, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error saving meter reading:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Đã tồn tại chỉ số cho kỳ này' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to save meter reading' },
      { status: 500 }
    )
  }
}
