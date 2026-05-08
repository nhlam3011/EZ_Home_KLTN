import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
const COOKIE_NAME = 'ez_session'

/**
 * Verify session token in middleware (Edge Runtime compatible)
 */
async function verifyToken(token: string): Promise<{ userId: number; role: string; exp: number } | null> {
    try {
        const parts = token.split('.')
        if (parts.length !== 2) return null

        const [payloadStr, signature] = parts

        // Verify HMAC signature
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        )
        const expectedSig = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(payloadStr)
        )
        const expectedSigStr = btoa(String.fromCharCode(...new Uint8Array(expectedSig)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

        if (signature !== expectedSigStr) return null

        // Decode payload
        const decoded = atob(payloadStr.replace(/-/g, '+').replace(/_/g, '/'))
        const payload = JSON.parse(decoded)

        // Check expiration
        if (payload.exp < Date.now()) return null

        return payload
    } catch {
        return null
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Skip middleware for static assets, public files and already handled routes
    const isStaticAsset =
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') ||
        pathname.startsWith('/api') ||
        pathname === '/maintenance' ||
        pathname === '/logo_final.png'

    if (isStaticAsset) {
        return NextResponse.next()
    }

    // 2. Server-side role-based route protection
    const isAdminRoute = pathname.startsWith('/admin')
    const isTenantRoute = pathname.startsWith('/tenant')
    const isProtectedRoute = isAdminRoute || isTenantRoute

    if (isProtectedRoute) {
        const token = request.cookies.get(COOKIE_NAME)?.value

        if (!token) {
            // No session cookie → redirect to login
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }

        const session = await verifyToken(token)

        if (!session) {
            // Invalid/expired token → clear cookie and redirect
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            const response = NextResponse.redirect(loginUrl)
            response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
            return response
        }

        // Role-based access control (SERVER-SIDE - cannot be tampered!)
        if (isAdminRoute && session.role !== 'ADMIN') {
            // Non-admin trying to access /admin → redirect to tenant
            return NextResponse.redirect(new URL('/tenant', request.url))
        }

        if (isTenantRoute && session.role !== 'TENANT') {
            // Non-tenant trying to access /tenant → redirect to admin
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    // 3. Maintenance mode check (existing behavior)
    try {
        const origin = request.nextUrl.origin

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1000) // 1s timeout

        const response = await fetch(`${origin}/api/system/check-maintenance`, {
            cache: 'no-store',
            signal: controller.signal
        }).catch(() => null)

        clearTimeout(timeoutId)

        if (response && response.ok) {
            const data = await response.json().catch(() => null)
            if (data && data.enabled && pathname !== '/maintenance') {
                return NextResponse.redirect(new URL('/maintenance', request.url))
            }
        }
    } catch (error) {
        // Silent fail
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|logo_final.png).*)',
    ],
}
