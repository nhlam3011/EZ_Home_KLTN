import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key'

// Simple JWT-like token using HMAC
// Structure: base64(payload).base64(signature)

function base64url(str: string): string {
  return Buffer.from(str).toString('base64url')
}

function fromBase64url(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8')
}

async function createHmac(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  )
  return Buffer.from(signature).toString('base64url')
}

export interface SessionPayload {
  userId: number
  role: string
  exp: number // expiration timestamp
}

/**
 * Create a signed session token
 */
export async function createSessionToken(userId: number, role: string, rememberMe: boolean = false): Promise<string> {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000) // 30 days or 1 day
  }

  const payloadStr = base64url(JSON.stringify(payload))
  const signature = await createHmac(payloadStr)

  return `${payloadStr}.${signature}`
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payloadStr, signature] = parts
    const expectedSignature = await createHmac(payloadStr)

    if (signature !== expectedSignature) return null

    const payload: SessionPayload = JSON.parse(fromBase64url(payloadStr))

    // Check expiration
    if (payload.exp < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

const COOKIE_NAME = 'ez_session'

/**
 * Set the session cookie on a response
 */
export function setSessionCookie(response: NextResponse, token: string, rememberMe: boolean = false) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
  })
}

/**
 * Clear the session cookie
 */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/**
 * Get session from a request's cookies
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/**
 * Get the full user data from session (DB lookup)
 */
export async function getUserFromSession(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      isFirstLogin: true,
      avatarUrl: true,
      contracts: {
        where: { 
          OR: [
            { status: 'ACTIVE' },
            { 
              status: 'EXPIRED',
              endDate: {
                gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
              }
            }
          ]
        },
        include: { room: true },
        take: 1,
        orderBy: { startDate: 'desc' as const }
      }
    }
  })

  if (!user || !user.isActive) return null

  return {
    id: user.id,
    phone: user.phone,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isFirstLogin: user.isFirstLogin,
    avatarUrl: user.avatarUrl,
    room: user.contracts[0]?.room || null
  }
}

export { COOKIE_NAME }
