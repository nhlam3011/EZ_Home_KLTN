import { NextResponse } from 'next/server'

export async function middleware(request: any) {
    const { pathname } = request.nextUrl

    // Allow static files, api routes, admin routes, and login
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/favicon.ico') ||
        pathname === '/maintenance' ||
        pathname === '/logo_final.png'
    ) {
        return NextResponse.next()
    }

    try {
        // Fetch maintenance status from our internal API
        const origin = request.nextUrl.origin
        const response = await fetch(`${origin}/api/system/check-maintenance`, {
            cache: 'no-store'
        })
        const data = await response.json()

        if (data && data.enabled) {
            return NextResponse.redirect(new URL('/maintenance', request.url))
        }
    } catch (error) {
        // Silent fail to avoid breaking the site if API is down
        console.error('Middleware maintenance check failed:', error)
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
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
