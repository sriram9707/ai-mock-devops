import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const session = await auth()
    const { pathname } = request.nextUrl

    // 1. Protected Routes: Dashboard, Onboarding, Interview
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/interview')) {
        if (!session?.user) {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // 2. Auth Routes: Login - redirect if already authenticated
    if (pathname.startsWith('/login')) {
        if (session?.user) {
            const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard'
            return NextResponse.redirect(new URL(callbackUrl, request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/onboarding/:path*',
        '/interview/:path*',
        '/login/:path*',
    ],
}
