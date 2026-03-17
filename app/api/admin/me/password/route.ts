import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function PUT(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        })

        if (!user) {
            return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
        }

        // Verify current password
        const isValid = await verifyPassword(currentPassword, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 })
        }

        // Hash and update new password
        const hashedPassword = await hashPassword(newPassword)
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ message: 'Đổi mật khẩu thành công' })
    } catch (error) {
        console.error('Error changing password:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
