import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(
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
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.cccdNumber) {
      return NextResponse.json(
        { error: 'Không thể reset mật khẩu. Cư dân chưa có số CCCD.' },
        { status: 400 }
      )
    }

    // Reset password to CCCD number
    const hashedPassword = await hashPassword(user.cccdNumber)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isFirstLogin: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Reset mật khẩu thành công. Mật khẩu mới là số CCCD.'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
