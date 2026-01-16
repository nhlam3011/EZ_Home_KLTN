import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

// API để kiểm tra xem password có được hash chưa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Vui lòng nhập số điện thoại' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Check if password looks like bcrypt hash (starts with $2a$ or $2b$)
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
    
    let isValid = false
    if (isHashed && password) {
      isValid = await verifyPassword(password, user.password)
    } else if (!isHashed && password) {
      // Plain text comparison (for migration)
      isValid = user.password === password
    }

    return NextResponse.json({
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      isPasswordHashed: isHashed,
      isPasswordValid: isValid,
      passwordLength: user.password.length
    })
  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi kiểm tra mật khẩu' },
      { status: 500 }
    )
  }
}
