import { NextRequest, NextResponse } from 'next/server'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { receiverId, senderId, senderRole, isTyping } = body

        if (!receiverId || !senderId || !senderRole) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const channel = senderRole === 'ADMIN' ? CHANNELS.TENANT_MESSAGES : CHANNELS.ADMIN_MESSAGES

        await pusherServer.trigger(channel, EVENTS.TYPING, {
            senderId,
            senderRole,
            receiverId,
            isTyping
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error triggering typing event:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
