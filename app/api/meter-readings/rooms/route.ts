import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Lấy danh sách phòng với chỉ số điện nước để chốt
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString()
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Get all rooms with active contracts
    const rooms = await prisma.room.findMany({
      where: {
        status: 'RENTED',
        contracts: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            user: true
          },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get last month's readings
    let lastMonth = parseInt(month) - 1
    let lastYear = parseInt(year)
    if (lastMonth === 0) {
      lastMonth = 12
      lastYear -= 1
    }

    // Get current month's readings (if any)
    const currentReadings = await prisma.meterReading.findMany({
      where: {
        month: parseInt(month),
        year: parseInt(year)
      }
    })

    // Get last month's readings
    const lastReadings = await prisma.meterReading.findMany({
      where: {
        month: lastMonth,
        year: lastYear
      }
    })

    // Map readings by roomId
    const currentReadingsMap = new Map(
      currentReadings.map(r => [r.roomId, r])
    )
    const lastReadingsMap = new Map(
      lastReadings.map(r => [r.roomId, r])
    )

    // Build response with room data and meter readings
    const roomsWithReadings = rooms.map(room => {
      const lastReading = lastReadingsMap.get(room.id)
      const currentReading = currentReadingsMap.get(room.id)

      return {
        id: room.id,
        name: room.name,
        floor: room.floor,
        contract: room.contracts[0] || null,
        elecOld: lastReading ? lastReading.elecNew : 0,
        waterOld: lastReading ? lastReading.waterNew : 0,
        elecNew: currentReading ? currentReading.elecNew : null,
        waterNew: currentReading ? currentReading.waterNew : null,
        elecConsumption: currentReading 
          ? currentReading.elecNew - (lastReading ? lastReading.elecNew : 0)
          : null,
        waterConsumption: currentReading
          ? currentReading.waterNew - (lastReading ? lastReading.waterNew : 0)
          : null,
        hasReading: !!currentReading
      }
    })

    return NextResponse.json(roomsWithReadings)
  } catch (error) {
    console.error('Error fetching rooms for meter reading:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}
