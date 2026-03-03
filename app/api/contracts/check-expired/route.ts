import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Check and update expired contracts
 * Contracts with endDate < now should be marked as EXPIRED
 * This should be called periodically or when needed
 */
export async function POST(request: NextRequest) {
    try {
        const now = new Date()

        // Find all ACTIVE contracts where endDate has passed
        const expiredContracts = await prisma.contract.findMany({
            where: {
                status: 'ACTIVE',
                endDate: {
                    lt: now
                }
            }
        })

        let updatedCount = 0

        // Update each expired contract
        if (expiredContracts.length > 0) {
            await prisma.contract.updateMany({
                where: {
                    id: {
                        in: expiredContracts.map(c => c.id)
                    }
                },
                data: {
                    status: 'EXPIRED'
                }
            })
            updatedCount = expiredContracts.length
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedCount} contracts to EXPIRED status`,
            count: updatedCount
        })
    } catch (error) {
        console.error('Error checking expired contracts:', error)
        return NextResponse.json(
            { error: 'Failed to check expired contracts' },
            { status: 500 }
        )
    }
}

/**
 * Get contracts status info
 */
export async function GET() {
    try {
        const now = new Date()

        const [activeCount, expiredCount, totalCount] = await Promise.all([
            prisma.contract.count({
                where: { status: 'ACTIVE' }
            }),
            prisma.contract.count({
                where: { status: 'EXPIRED' }
            }),
            prisma.contract.count()
        ])

        // Find contracts expiring soon (within 30 days)
        const expiringSoon = await prisma.contract.count({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: now,
                    lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                }
            }
        })

        return NextResponse.json({
            activeCount,
            expiredCount,
            expiringSoon,
            totalCount,
            message: 'Contract status overview'
        })
    } catch (error) {
        console.error('Error getting contract stats:', error)
        return NextResponse.json(
            { error: 'Failed to get stats' },
            { status: 500 }
        )
    }
}
