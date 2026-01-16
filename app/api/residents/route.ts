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
    if (!phone || !fullName || !cccdNumber) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc' },
        { status: 400 }
      )
    }

    if (!roomId || !startDate || !rentPrice) {
      return NextResponse.json(
        { error: 'Vui lòng chọn phòng và nhập thông tin hợp đồng' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Số điện thoại đã tồn tại trong hệ thống' },
        { status: 400 }
      )
    }

    // Check if CCCD already exists
    if (cccdNumber) {
      const existingCCCD = await prisma.user.findUnique({
        where: { cccdNumber }
      })

      if (existingCCCD) {
        return NextResponse.json(
          { error: 'Số CCCD đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Hash password (use CCCD as initial password)
    const hashedPassword = await hashPassword(cccdNumber)

    // Create user with password = CCCD and isFirstLogin = true
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        fullName,
        email: email || null,
        cccdNumber: cccdNumber || null,
        dob: dob ? new Date(dob) : null,
        address: address || null,
        role: 'TENANT',
        isFirstLogin: true // Set to true for first login
      }
    })

    // Get occupants data (if provided)
    const occupants = body.occupants || [] // Array of {fullName, cccdNumber, phone, dob, relationship}

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
        occupants: {
          create: occupants.map((occ: any) => ({
            fullName: occ.fullName,
            cccdNumber: occ.cccdNumber || null,
            phone: occ.phone || null,
            dob: occ.dob ? new Date(occ.dob) : null,
            relationship: occ.relationship || null
          }))
        }
      },
      include: {
        occupants: true
      }
    })

    // Calculate total number of people (1 main tenant + occupants)
    const totalPeople = 1 + occupants.length

    // Get current room to check maxPeople
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) }
    })

    if (room && totalPeople > room.maxPeople) {
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
  } catch (error) {
    console.error('Error creating resident:', error)
    return NextResponse.json(
      { error: 'Lỗi khi tạo cư dân' },
      { status: 500 }
    )
  }
}
