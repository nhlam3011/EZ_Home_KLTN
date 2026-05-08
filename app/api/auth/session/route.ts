import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession, clearSessionCookie } from '@/lib/session'

/**
 * GET /api/auth/session
 * Returns the current user from the HttpOnly session cookie.
 * This is the ONLY way clients should get user identity.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request)

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/session
 * Logout - clears the session cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
