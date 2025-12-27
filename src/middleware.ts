import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const userId = request.cookies.get('userId')?.value
    const { pathname } = request.nextUrl

    // 1. Protected Routes: Dashboard, Onboarding, Interview
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/interview')) {
        if (!userId) {
            const loginUrl = new URL('/login', request.url)
            // Optional: Add ?next=pathname to redirect back after login
            return NextResponse.redirect(loginUrl)
        }
    }

    // 2. Auth Routes: Login
    if (pathname.startsWith('/login')) {
        if (userId) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/onboarding/:path*',
        '/interview/:path*',
        '/login'
    ],
}
