import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const setting = await prisma.settings.findUnique({
            where: { key: 'maintenance_mode' }
        })

        return NextResponse.json({ enabled: setting?.value === 'true' })
    } catch (error) {
        console.error('Error checking maintenance mode:', error)
        return NextResponse.json({ enabled: false })
    }
}
