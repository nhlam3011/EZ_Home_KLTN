import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const userId = parseInt(resolvedParams.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contracts: {
          include: {
            room: true,
            occupants: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get invoices for payment history
    const contracts = user.contracts.map(c => c.id)
    const invoices = await prisma.invoice.findMany({
      where: {
        contractId: { in: contracts }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get service orders
    const serviceOrders = await prisma.serviceOrder.findMany({
      where: { userId: user.id },
      include: {
        service: true
      },
      orderBy: { orderDate: 'desc' }
    })

    // Calculate current debt (unpaid invoices)
    const unpaidInvoices = invoices.filter(inv => inv.status === 'UNPAID')
    const currentDebt = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

    return NextResponse.json({
      ...user,
      invoices,
      serviceOrders,
      currentDebt,
      unpaidInvoicesCount: unpaidInvoices.length
    })
  } catch (error) {
    console.error('Error fetching resident details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resident details' },
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
    const userId = parseInt(resolvedParams.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      cccdNumber,
      cccdDate,
      cccdPlace,
      dob,
      address,
      gender,
      job,
      licensePlate
    } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone }
      })
      if (phoneExists) {
        return NextResponse.json(
          { error: 'Số điện thoại đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Check if CCCD is being changed and if it's already taken
    if (cccdNumber && cccdNumber !== existingUser.cccdNumber) {
      const cccdExists = await prisma.user.findUnique({
        where: { cccdNumber }
      })
      if (cccdExists) {
        return NextResponse.json(
          { error: 'Số CCCD đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updateData: any = {}
    if (fullName) updateData.fullName = fullName
    if (email !== undefined) updateData.email = email || null
    if (phone) updateData.phone = phone
    if (cccdNumber !== undefined) updateData.cccdNumber = cccdNumber || null
    if (cccdDate !== undefined) updateData.cccdDate = cccdDate ? new Date(cccdDate) : null
    if (cccdPlace !== undefined) updateData.cccdPlace = cccdPlace || null
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null
    if (address !== undefined) updateData.address = address || null
    if (gender !== undefined) updateData.gender = gender || null
    if (job !== undefined) updateData.job = job || null
    if (licensePlate !== undefined) updateData.licensePlate = licensePlate || null

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating resident:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Thông tin đã tồn tại trong hệ thống' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update resident' },
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
    const userId = parseInt(resolvedParams.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contracts: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has active contract
    if (user.contracts.length > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa cư dân đang có hợp đồng hoạt động. Vui lòng check-out trước.' },
        { status: 400 }
      )
    }

    // Delete related data
    // 1. Delete documents and files
    const documents = await prisma.document.findMany({
      where: { userId }
    })
    
    const { unlink } = await import('fs/promises')
    const { existsSync } = await import('fs')
    const { join } = await import('path')
    
    for (const doc of documents) {
      try {
        const filePath = join(process.cwd(), 'public', doc.fileUrl)
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      } catch (error) {
        console.error('Error deleting document file:', error)
      }
    }
    await prisma.document.deleteMany({ where: { userId } })

    // 2. Delete avatar file if exists
    if (user.avatarUrl) {
      try {
        const avatarPath = join(process.cwd(), 'public', user.avatarUrl)
        if (existsSync(avatarPath)) {
          await unlink(avatarPath)
        }
      } catch (error) {
        console.error('Error deleting avatar file:', error)
      }
    }

    // 3. Delete contract occupants (will be handled by cascade or manual delete)
    const contracts = await prisma.contract.findMany({
      where: { userId },
      include: { occupants: true }
    })
    
    for (const contract of contracts) {
      await prisma.contractOccupant.deleteMany({
        where: { contractId: contract.id }
      })
    }

    // 4. Delete invoices related to user's contracts
    const contractIds = await prisma.contract.findMany({
      where: { userId },
      select: { id: true }
    })
    const contractIdList = contractIds.map(c => c.id)
    if (contractIdList.length > 0) {
      await prisma.invoice.deleteMany({
        where: { contractId: { in: contractIdList } }
      })
    }

    // 5. Delete other related data
    await prisma.serviceOrder.deleteMany({ where: { userId } })
    await prisma.issue.deleteMany({ where: { userId } })
    await prisma.post.deleteMany({ where: { userId } })
    
    // 6. Delete contracts (after deleting invoices)
    await prisma.contract.deleteMany({ where: { userId } })

    // 7. Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Xóa cư dân thành công'
    })
  } catch (error: any) {
    console.error('Error deleting resident:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete resident' },
      { status: 500 }
    )
  }
}
