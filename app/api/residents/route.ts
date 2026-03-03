import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const building = searchParams.get('building')
    const floor = searchParams.get('floor')
    const status = searchParams.get('status')

    const where: any = { role: 'TENANT' }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          contracts: {
            some: { room: { name: { contains: search, mode: 'insensitive' } } }
          }
        }
      ]
    }

    // Restore DB-level filtering for building, floor, and status
    if (building !== 'all' || floor !== 'all' || status !== 'all') {
      where.contracts = {
        some: {
          ...(status === 'renting' || status === 'ACTIVE' ? { status: 'ACTIVE' } : status === 'INACTIVE' ? { status: { not: 'ACTIVE' } } : {}),
          room: {
            ...(building && building !== 'all' ? { name: { contains: building } } : {}),
            ...(floor && floor !== 'all' ? { floor: parseInt(floor) } : {})
          }
        }
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        contracts: {
          where: status === 'renting' || status === 'ACTIVE' ? { status: 'ACTIVE' } : undefined,
          include: { room: true },
          take: 1,
          orderBy: { startDate: 'desc' }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    return NextResponse.json({
      residents: users,
      total: users.length
    })
  } catch (error) {
    console.error('Error fetching residents:', error)
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách cư dân' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      phone,
      fullName,
      email,
      cccdNumber,
      dob,
      address,
      roomId,
      startDate,
      endDate,
      deposit,
      rentPrice
    } = body

    // Validate required fields
    if (!phone || !phone.trim() || !fullName || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc (Số điện thoại, Họ tên)' },
        { status: 400 }
      )
    }

    if (!roomId || !startDate || !rentPrice) {
      return NextResponse.json(
        { error: 'Vui lòng chọn phòng và nhập thông tin hợp đồng' },
        { status: 400 }
      )
    }

    // Check if room exists and is available
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Phòng không tồn tại' },
        { status: 404 }
      )
    }

    if (room.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Phòng không còn trống' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: phone.trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Số điện thoại đã tồn tại trong hệ thống' },
        { status: 400 }
      )
    }

    // Check if CCCD already exists (only if provided and not empty)
    if (cccdNumber && cccdNumber.trim()) {
      const existingCCCD = await prisma.user.findFirst({
        where: {
          cccdNumber: cccdNumber.trim()
        }
      })

      if (existingCCCD) {
        return NextResponse.json(
          { error: 'Số CCCD đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Check if email already exists (only if provided and not empty)
    if (email && email.trim()) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: email.trim()
        }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Hash password (use CCCD as initial password, or phone if CCCD not provided)
    const initialPassword = (cccdNumber && cccdNumber.trim()) ? cccdNumber.trim() : phone
    const hashedPassword = await hashPassword(initialPassword)

    // Create user with password = CCCD (or phone) and isFirstLogin = true
    const user = await prisma.user.create({
      data: {
        phone: phone.trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        email: (email && email.trim()) ? email.trim() : null,
        cccdNumber: (cccdNumber && cccdNumber.trim()) ? cccdNumber.trim() : null,
        dob: dob ? new Date(dob) : null,
        address: address ? address.trim() : null,
        role: 'TENANT',
        isFirstLogin: true // Set to true for first login
      }
    })

    // Get occupants data (if provided) - filter out empty occupants
    const occupants = (body.occupants || []).filter((occ: any) =>
      occ && occ.fullName && occ.fullName.trim()
    ) // Only include occupants with at least a name

    // Create contract with occupants
    const contract = await prisma.contract.create({
      data: {
        userId: user.id,
        roomId: parseInt(roomId),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        deposit: deposit ? parseFloat(deposit) : 0,
        rentPrice: parseFloat(rentPrice),
        status: 'ACTIVE',
        occupants: occupants.length > 0 ? {
          create: occupants.map((occ: any) => ({
            fullName: occ.fullName.trim(),
            cccdNumber: (occ.cccdNumber && occ.cccdNumber.trim()) ? occ.cccdNumber.trim() : null,
            phone: (occ.phone && occ.phone.trim()) ? occ.phone.trim() : null,
            dob: occ.dob ? new Date(occ.dob) : null,
            relationship: (occ.relationship && occ.relationship.trim()) ? occ.relationship.trim() : null
          }))
        } : undefined
      },
      include: {
        occupants: true
      }
    })

    // Calculate total number of people (1 main tenant + occupants)
    const totalPeople = 1 + occupants.length

    // Update room status and maxPeople if needed
    if (totalPeople > room.maxPeople) {
      // If exceeds maxPeople, update maxPeople to match
      await prisma.room.update({
        where: { id: parseInt(roomId) },
        data: {
          status: 'RENTED',
          maxPeople: totalPeople // Update maxPeople to accommodate all occupants
        }
      })
    } else {
      // Update room status only
      await prisma.room.update({
        where: { id: parseInt(roomId) },
        data: { status: 'RENTED' }
      })
    }

    return NextResponse.json({
      user,
      contract,
      message: 'Tạo cư dân và hợp đồng thành công. Mật khẩu ban đầu là số CCCD.'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating resident:', error)
    console.error('Error details:', {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    })

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || error.meta?.target?.[0]
      if (field === 'phone') {
        return NextResponse.json(
          { error: 'Số điện thoại đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
      if (field === 'email') {
        return NextResponse.json(
          { error: 'Email đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
      if (field === 'cccdNumber') {
        return NextResponse.json(
          { error: 'Số CCCD đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: `Thông tin đã tồn tại trong hệ thống (${field || 'unknown'})` },
        { status: 400 }
      )
    }

    if (error.code === 'P2003') {
      // Foreign key constraint violation
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin phòng.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: error.message || 'Lỗi khi tạo cư dân',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Export residents to Excel
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'export') {
      const users = await prisma.user.findMany({
        where: { role: 'TENANT' },
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            include: { room: true },
            take: 1
          }
        },
        orderBy: { fullName: 'asc' }
      })

      const exportData = users.map(user => ({
        'Họ tên': user.fullName,
        'Số điện thoại': user.phone,
        'Email': user.email || '',
        'CCCD': user.cccdNumber || '',
        'Ngày sinh': user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '',
        'Địa chỉ': user.address || '',
        'Phòng': user.contracts && user.contracts.length > 0 ? user.contracts[0].room.name : '',
        'Ngày vào ở': user.contracts && user.contracts.length > 0 && user.contracts[0].startDate ? new Date(user.contracts[0].startDate).toLocaleDateString('vi-VN') : '',
        'Giá thuê': user.contracts && user.contracts.length > 0 ? user.contracts[0].rentPrice : ''
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Cư dân')

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="danh-sach-cu-dan.xlsx"'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting residents:', error)
    return NextResponse.json({ error: 'Failed to export residents' }, { status: 500 })
  }
}

// Import residents from Excel
export async function PATCH(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

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
        const phone = row['Số điện thoại'] || row['phone']
        const fullName = row['Họ tên'] || row['fullName']

        if (!phone || !fullName) {
          results.failed++
          results.errors.push(`Thiếu SĐT hoặc Họ tên`)
          continue
        }

        const roomName = row['Phòng'] || row['room']

        // Find or create room if provided
        let roomId: number | undefined
        if (roomName) {
          const room = await prisma.room.findUnique({
            where: { name: roomName }
          })
          roomId = room?.id
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { phone }
        })

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              fullName,
              email: row['Email'] || row['email'] || null,
              cccdNumber: row['CCCD'] || row['cccdNumber'] || null,
              dob: row['Ngày sinh'] ? new Date(row['Ngày sinh']) : null,
              address: row['Địa chỉ'] || row['address'] || null
            }
          })
        } else {
          // Create new user
          const hashedPassword = await hashPassword(phone)
          await prisma.user.create({
            data: {
              phone,
              password: hashedPassword,
              fullName,
              email: row['Email'] || row['email'] || null,
              cccdNumber: row['CCCD'] || row['cccdNumber'] || null,
              dob: row['Ngày sinh'] ? new Date(row['Ngày sinh']) : null,
              address: row['Địa chỉ'] || row['address'] || null,
              role: 'TENANT',
              isFirstLogin: true
            }
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
    console.error('Error importing residents:', error)
    return NextResponse.json({ error: error.message || 'Failed to import residents' }, { status: 500 })
  }
}
