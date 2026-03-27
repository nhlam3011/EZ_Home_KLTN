import { NextRequest } from 'next/server'
import { communityEvents, COMMUNITY_EVENTS } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const responseStream = new TransformStream()
    const writer = responseStream.writable.getWriter()
    const encoder = new TextEncoder()

    const onEvent = async (type: string, data: any) => {
        try {
            // Check if stream is still writable
            await writer.ready
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`))
        } catch (e) {
            // If writer is closed, this will fail silently as expected for a disconnected client
            console.log('SSE client disconnected, stopping updates for this session')
        }
    }

    // Subscribe to all event types
    const eventHandlers: Record<string, (data: any) => void> = {}

    Object.values(COMMUNITY_EVENTS).forEach(eventType => {
        const handler = (data: any) => {
            if (req.signal.aborted) return
            onEvent(eventType, data).catch(() => {
                // Ignore errors from specific emits if client is gone
            })
        }
        eventHandlers[eventType] = handler
        communityEvents.on(eventType, handler)
    })

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        try {
            writer.write(encoder.encode(': heartbeat\n\n'))
        } catch (e) {
            clearInterval(heartbeat)
        }
    }, 15000)

    // Cleanup on disconnect
    req.signal.onabort = () => {
        clearInterval(heartbeat)
        Object.keys(eventHandlers).forEach(eventType => {
            communityEvents.removeListener(eventType, eventHandlers[eventType])
        })
        writer.close().catch(() => {})
    }

    return new Response(responseStream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    })
}
