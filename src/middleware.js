// src/middleware.js
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // 1. API Rate Limiting Gate
  if (pathname.startsWith('/api')) {
    const ip = getClientIp(req)
    // Sensitive endpoints (e.g. auth attempts, signup) have stricter limit
    const isSensitive = pathname.startsWith('/api/auth')
    const limit = isSensitive ? 20 : 100
    const windowMs = 60 * 1000 // 1 minute window

    const rateResult = checkRateLimit(`${ip}:${isSensitive ? 'auth' : 'api'}`, {
      limit,
      windowMs,
    })

    if (!rateResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: rateResult.resetInSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateResult.resetInSeconds),
            'X-RateLimit-Limit': String(rateResult.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(rateResult.limit))
    response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining))
    return response
  }

  // 2. Authentication and Protected Routes Handling
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  const cookieName = req.cookies.get('authjs.session-token')
    ? 'authjs.session-token'
    : req.cookies.get('__Secure-authjs.session-token')
    ? '__Secure-authjs.session-token'
    : req.cookies.get('__Secure-next-auth.session-token')
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'

  const token = await getToken({
    req,
    secret,
    cookieName,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  const isLoggedIn = !!token

  const isAuthRoute = pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup')
  const isProtectedRoute = pathname.startsWith('/desk') || pathname.startsWith('/settings')

  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/desk', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static media (*.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp)
     */
    '/((?!_next/static|_next/image|favicon.png|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
