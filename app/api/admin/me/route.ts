import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: {
                id: true,
                phone: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                role: true,
                gender: true,
                dob: true,
                address: true,
                createdAt: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching admin profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { fullName, email } = body

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                ...(fullName && { fullName }),
                ...(email !== undefined && { email: email || null }),
            },
            select: {
                id: true,
                phone: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                role: true,
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Error updating admin profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
