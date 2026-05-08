import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password, rememberMe } = body

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
            where: { 
              OR: [
                { status: 'ACTIVE' },
                { 
                  status: 'EXPIRED',
                  endDate: {
                    gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
                  }
                }
              ]
            }
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

    // Create signed session token
    const token = await createSessionToken(user.id, user.role, !!rememberMe)

    // Build response with user data
    const response = NextResponse.json({
      success: true,
      user,
      token // kept for backward compat, but cookie is the real auth
    })

    // Set HttpOnly secure cookie
    setSessionCookie(response, token, !!rememberMe)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    )
  }
}
