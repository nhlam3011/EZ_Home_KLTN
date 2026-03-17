import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.settings.findMany({
            orderBy: { key: 'asc' }
        })

        // Convert to key-value object
        const settingsObj: Record<string, string> = {}
        settings.forEach(s => {
            settingsObj[s.key] = s.value
        })

        return NextResponse.json(settingsObj)
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { key, value, description } = body

        if (!key || value === undefined) {
            return NextResponse.json(
                { error: 'Key and value are required' },
                { status: 400 }
            )
        }

        // Upsert setting - create if not exists, update if exists
        const setting = await prisma.settings.upsert({
            where: { key },
            update: {
                value: String(value),
                description: description || null
            },
            create: {
                key,
                value: String(value),
                description: description || null
            }
        })

        return NextResponse.json(setting)
    } catch (error) {
        console.error('Error saving setting:', error)
        return NextResponse.json(
            { error: 'Failed to save setting' },
            { status: 500 }
        )
    }
}
