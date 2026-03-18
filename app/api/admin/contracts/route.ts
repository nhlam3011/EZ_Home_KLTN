import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get active contracts that can be extended
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''

        const where: any = {
            status: 'ACTIVE'
        }

        if (search) {
            where.OR = [
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search } } },
                { room: { name: { contains: search, mode: 'insensitive' } } }
            ]
        }

        const contracts = await prisma.contract.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        floor: true
                    }
                }
            },
            orderBy: {
                endDate: 'asc' // Sort by end date - expired contracts first
            },
            take: 50
        })

        return NextResponse.json({ contracts })
    } catch (error) {
        console.error('Error fetching contracts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch contracts' },
            { status: 500 }
        )
    }
}
