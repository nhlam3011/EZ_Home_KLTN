import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, newPassword } = body

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

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ có thể reset mật khẩu cho admin' },
        { status: 403 }
      )
    }

    // Hash new password or use default
    const passwordToHash = newPassword || 'admin123'
    const hashedPassword = await hashPassword(passwordToHash)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isFirstLogin: false
      }
    })

    return NextResponse.json({
      success: true,
      message: `Đã reset mật khẩu thành công. Mật khẩu mới: ${passwordToHash}`,
      phone: user.phone
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi reset mật khẩu' },
      { status: 500 }
    )
  }
}
