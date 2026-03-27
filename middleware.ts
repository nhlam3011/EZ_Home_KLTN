import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Skip middleware for static assets, public files and already handled routes
    // Adding more extensions to skip common assets quickly
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

    try {
        const origin = request.nextUrl.origin
        
        // Cực kỳ quan trọng: Thêm timeout cho fetch trong middleware
        // Nếu API check-maintenance chậm, nó sẽ không kéo sập TTFB của toàn bộ site
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
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|logo_final.png).*)',
    ],
}
