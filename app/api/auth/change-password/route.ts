import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin người dùng' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      )
    }

    // Check if password is hashed (bcrypt hash starts with $2a$ or $2b$)
    const isPasswordHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
    
    // Verify current password
    let isValid = false
    if (isPasswordHashed) {
      isValid = await verifyPassword(currentPassword, user.password)
    } else {
      // Plain text comparison (for migration/backward compatibility)
      isValid = user.password === currentPassword
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không đúng' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password and set isFirstLogin to false
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isFirstLogin: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đổi mật khẩu' },
      { status: 500 }
    )
  }
}
