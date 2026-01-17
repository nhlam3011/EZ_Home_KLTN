import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const building = searchParams.get('building')
    const floor = searchParams.get('floor')
    const status = searchParams.get('status')

    const where: any = {
      role: 'TENANT'
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        contracts: {
          where: status === 'renting' ? { status: 'ACTIVE' } : undefined,
          include: {
            room: true
          },
          take: 1,
          orderBy: { startDate: 'desc' }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    // Filter by floor and building if specified
    let filteredUsers = users
    if (floor && floor !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const contract = user.contracts[0]
        return contract?.room?.floor === parseInt(floor)
      })
    }

    if (building && building !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const contract = user.contracts[0]
        const roomName = contract?.room?.name || ''
        return roomName.includes(building)
      })
    }

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'ACTIVE') {
        filteredUsers = filteredUsers.filter(user => {
          return user.contracts.length > 0 && user.contracts[0]?.status === 'ACTIVE'
        })
      } else if (status === 'INACTIVE') {
        filteredUsers = filteredUsers.filter(user => {
          return user.contracts.length === 0 || user.contracts[0]?.status !== 'ACTIVE'
        })
      }
    }

    return NextResponse.json({
      residents: filteredUsers,
      total: filteredUsers.length
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
