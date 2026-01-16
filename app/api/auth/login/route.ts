import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(phone, password)

    if (!user) {
      // Check if user exists to provide better error message
      const userExists = await prisma.user.findUnique({
        where: { phone },
        include: {
          contracts: {
            where: { status: 'ACTIVE' }
          }
        }
      })

      if (userExists) {
        if (!userExists.isActive) {
          return NextResponse.json(
            { error: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' },
            { status: 403 }
          )
        }
        if (userExists.role === 'TENANT' && userExists.contracts.length === 0) {
          return NextResponse.json(
            { error: 'Tài khoản của bạn không còn hợp đồng hoạt động. Vui lòng liên hệ quản trị viên.' },
            { status: 403 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Số điện thoại hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // In production, generate JWT token here
    const token = `token-${user.id}-${Date.now()}`

    return NextResponse.json({
      success: true,
      user,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    )
  }
}
