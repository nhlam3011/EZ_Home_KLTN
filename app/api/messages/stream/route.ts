import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Server-Sent Events endpoint for real-time message updates
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const otherUserId = searchParams.get('otherUserId') // The other user in the conversation
  const userRole = searchParams.get('role') // 'ADMIN' or 'TENANT'

  if (!userId || !otherUserId || !userRole) {
    return new Response('Missing required parameters', { status: 400 })
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let lastMessageId: number | null = null
      let isActive = true
      let intervalId: NodeJS.Timeout | null = null
      let heartbeatInterval: NodeJS.Timeout | null = null
      let authCheckInterval: NodeJS.Timeout | null = null
      let consecutiveErrors = 0
      const MAX_CONSECUTIVE_ERRORS = 5
      
      // Cache authenticated user
      let cachedUser: any = null
      let lastAuthCheck = 0
      const AUTH_CHECK_INTERVAL = 60000 // Check auth every 60 seconds

      // Cleanup on close
      const cleanup = () => {
        if (!isActive) return // Already cleaned up
        isActive = false
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
          heartbeatInterval = null
        }
        if (authCheckInterval) {
          clearInterval(authCheckInterval)
          authCheckInterval = null
        }
        try {
          if (controller.desiredSize !== null) {
            controller.close()
          }
        } catch (error) {
          // Ignore errors on close
        }
      }

      // Send initial connection message
      const send = (data: any) => {
        if (!isActive) return
        try {
          // Check if controller is still open before trying to enqueue
          if (controller.desiredSize === null) {
            // Controller is closed
            cleanup()
            return
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          consecutiveErrors = 0 // Reset error count on successful send
        } catch (error: any) {
          // If controller is closed, mark as inactive and cleanup
          if (error?.code === 'ERR_INVALID_STATE' || error?.message?.includes('closed')) {
            cleanup()
          } else {
            console.error('Error sending SSE data:', error)
            consecutiveErrors++
            // Only cleanup if too many consecutive errors
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              console.error('Too many consecutive errors, closing connection')
              cleanup()
            }
          }
        }
      }

      // Check authentication (cached)
      const checkAuth = async (force: boolean = false): Promise<boolean> => {
        const now = Date.now()
        // Use cached user if available and not expired
        if (!force && cachedUser && (now - lastAuthCheck) < AUTH_CHECK_INTERVAL) {
          return true
        }

        try {
          const currentUser = await getCurrentUser(request, parseInt(userId))
          if (!currentUser) {
            cachedUser = null
            return false
          }
          cachedUser = currentUser
          lastAuthCheck = now
          return true
        } catch (error) {
          console.error('Error checking auth:', error)
          // Don't invalidate cache on transient errors
          return cachedUser !== null
        }
      }

      // Poll for new messages
      const pollMessages = async () => {
        if (!isActive) return

        try {
          // Only check auth periodically, not on every poll
          const isAuthenticated = await checkAuth()
          if (!isAuthenticated) {
            send({ type: 'error', error: 'Unauthorized', code: 'AUTH_ERROR' })
            // Don't cleanup immediately, allow reconnection
            return
          }

          // Build where clause based on role
          const whereClause: any = {
            OR: [
              { senderId: parseInt(userId), receiverId: parseInt(otherUserId) },
              { senderId: parseInt(otherUserId), receiverId: parseInt(userId) }
            ]
          }

          // Only get messages newer than lastMessageId
          if (lastMessageId) {
            whereClause.id = { gt: lastMessageId }
          }

          const newMessages = await prisma.message.findMany({
            where: whereClause,
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  role: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  role: true
                }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 50
          })

          if (newMessages.length > 0) {
            // Update lastMessageId
            lastMessageId = newMessages[newMessages.length - 1].id

            // Mark messages as read if they're from the other user
            await prisma.message.updateMany({
              where: {
                senderId: parseInt(otherUserId),
                receiverId: parseInt(userId),
                isRead: false
              },
              data: { isRead: true }
            })

            // Send new messages
            send({ type: 'messages', messages: newMessages })
          }
        } catch (error: any) {
          // If controller is closed, don't try to send error
          if (error?.code === 'ERR_INVALID_STATE' || error?.message?.includes('closed')) {
            cleanup()
            return
          }
          console.error('Error polling messages:', error)
          consecutiveErrors++
          // Only send error if still active and not too many errors
          if (isActive && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
            send({ type: 'error', error: 'Failed to fetch messages', code: 'POLL_ERROR' })
          } else if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error('Too many consecutive errors, closing connection')
            cleanup()
          }
        }
      }

      // Initial auth check
      const initialAuth = await checkAuth(true)
      if (!initialAuth) {
        send({ type: 'error', error: 'Unauthorized', code: 'AUTH_ERROR' })
        cleanup()
        return
      }

      // Send initial connection success
      send({ type: 'connected', timestamp: Date.now() })

      // Initial poll
      await pollMessages()

      // Poll every 3 seconds for new messages (reduced from 1 second)
      intervalId = setInterval(async () => {
        if (!isActive) {
          cleanup()
          return
        }
        await pollMessages()
      }, 3000)

      // Send heartbeat every 30 seconds
      heartbeatInterval = setInterval(() => {
        if (!isActive) {
          cleanup()
          return
        }
        send({ type: 'heartbeat', timestamp: Date.now() })
      }, 30000)

      // Check auth periodically (every 60 seconds)
      authCheckInterval = setInterval(async () => {
        if (!isActive) {
          cleanup()
          return
        }
        const isAuthenticated = await checkAuth(true)
        if (!isAuthenticated) {
          send({ type: 'error', error: 'Session expired', code: 'SESSION_EXPIRED' })
          // Don't cleanup immediately, allow client to handle
        }
      }, AUTH_CHECK_INTERVAL)

      request.signal.addEventListener('abort', cleanup)
      
      // Also handle client disconnect
      if (request.signal.aborted) {
        cleanup()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    }
  })
}
