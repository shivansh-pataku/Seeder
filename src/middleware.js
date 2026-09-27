// src/middleware.js
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export async function middleware(req) {
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

  const { pathname } = req.nextUrl
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
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images and static media (*.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
