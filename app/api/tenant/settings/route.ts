import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - Lấy email notification settings cho tenant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    const user = await getCurrentUser(request, userId ? parseInt(userId) : undefined)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settingKeys = [
      `user_${user.id}_email_notify_invoice`,
      `user_${user.id}_email_notify_issue`,
      `user_${user.id}_email_notify_message`,
      `user_${user.id}_email_notify_general`,
    ]

    const settings = await prisma.settings.findMany({
      where: { key: { in: settingKeys } }
    })

    // Convert to simple object, default all to 'true'
    const result: Record<string, string> = {
      email_notify_invoice: 'true',
      email_notify_issue: 'true',
      email_notify_message: 'true',
      email_notify_general: 'true',
    }

    settings.forEach(s => {
      const shortKey = s.key.replace(`user_${user.id}_`, '')
      result[shortKey] = s.value
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tenant settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Lưu email notification settings cho tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, key, value } = body

    const user = await getCurrentUser(request, userId ? parseInt(userId) : undefined)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    const fullKey = `user_${user.id}_${key}`

    const setting = await prisma.settings.upsert({
      where: { key: fullKey },
      update: { value: String(value) },
      create: {
        key: fullKey,
        value: String(value),
        description: `User ${user.id} email notification setting: ${key}`
      }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error saving tenant setting:', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
}
