import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const floor = searchParams.get('floor')
    const search = searchParams.get('search')
    const buildingId = searchParams.get('buildingId')

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (floor && floor !== 'all') {
      where.floor = parseInt(floor)
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        {
          contracts: {
            some: {
              status: 'ACTIVE',
              OR: [
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { occupants: { some: { fullName: { contains: search, mode: 'insensitive' } } } }
              ]
            }
          }
        }
      ]
    }

    if (buildingId) {
      where.buildingId = parseInt(buildingId)
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        building: {
          select: {
            id: true,
            name: true
          }
        },
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
      orderBy: { name: 'asc' },
      take: limit,
      skip: skip
    })

    // Return as array even if there's an issue
    return NextResponse.json(Array.isArray(rooms) ? rooms : [])
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
    const { name, floor, price, area, maxPeople, status, roomType, description, amenities, buildingId } = body

    // Validate required fields
    if (!name || !floor || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if room name already exists
    const existingRoom = await prisma.room.findFirst({
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
        amenities: amenities && Array.isArray(amenities) ? amenities : [],
        buildingId: buildingId ? parseInt(buildingId) : null
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

// GET - Export rooms to Excel
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'export') {
      const buildingId = searchParams.get('buildingId')
      const where: any = {}
      if (buildingId) {
        where.buildingId = parseInt(buildingId)
      }

      const rooms = await prisma.room.findMany({
        where,
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            include: {
              user: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      // Transform data for export
      const exportData = rooms.map(room => ({
        'Tên phòng': room.name,
        'Tầng': room.floor,
        'Giá tiền': room.price,
        'Diện tích (m²)': room.area || '',
        'Số người tối đa': room.maxPeople,
        'Trạng thái': room.status === 'AVAILABLE' ? 'Trống' : room.status === 'RENTED' ? 'Đã thuê' : room.status,
        'Loại phòng': room.roomType || '',
        'Người thuê': room.contracts && room.contracts.length > 0 ? room.contracts[0].user.fullName : '',
        'SĐT người thuê': room.contracts && room.contracts.length > 0 ? room.contracts[0].user.phone || '' : ''
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Phòng')

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="danh-sach-phong.xlsx"'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting rooms:', error)
    return NextResponse.json({ error: 'Failed to export rooms' }, { status: 500 })
  }
}

// Import rooms from Excel
export async function PATCH(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const buildingId = formData.get('buildingId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data in file' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const row of data as any[]) {
      try {
        const roomData = {
          name: row['Tên phòng'] || row['name'],
          floor: parseInt(row['Tầng'] || row['floor']) || 1,
          price: parseFloat(row['Giá tiền'] || row['price']) || 0,
          area: row['Diện tích (m²)'] || row['area'] ? parseFloat(row['Diện tích (m²)'] || row['area']) : null,
          maxPeople: parseInt(row['Số người tối đa'] || row['maxPeople']) || 1,
          status: 'AVAILABLE' as const,
          roomType: row['Loại phòng'] || row['roomType'] || null,
          buildingId: buildingId ? parseInt(buildingId) : null
        }

        if (!roomData.name) {
          results.failed++
          results.errors.push(`Thiếu tên phòng`)
          continue
        }

        // Check if room exists
        const existingRoom = await prisma.room.findFirst({
          where: { name: roomData.name }
        })

        if (existingRoom) {
          // Update existing room
          await prisma.room.update({
            where: { id: existingRoom.id },
            data: roomData
          })
        } else {
          // Create new room
          await prisma.room.create({
            data: roomData
          })
        }

        results.success++
      } catch (err: any) {
        results.failed++
        results.errors.push(`Lỗi: ${err.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error importing rooms:', error)
    return NextResponse.json({ error: error.message || 'Failed to import rooms' }, { status: 500 })
  }
}
