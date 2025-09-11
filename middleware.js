// middleware.js - COMPLETE PROTECTION
// This middleware protects all routes except for public ones like signin, signup, and static assets.
// NextAuth V4, the session is not available in middleware, so we use a custom auth solution.
// But NextAuth V5 (currently employing managebly) fails to work /well in middleware as of now (09/09/2024).
import { auth } from './src/app/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname, origin } = req.nextUrl
  const isAuthenticated = !!req.auth

  console.log('🔒 Middleware Check:', {
    path: pathname,
    authenticated: isAuthenticated,
    userEmail: req.auth?.user?.email
  })

  // Public routes that anyone can access
  const publicRoutes = [
    '/',
    '/about',
    '/contact',
    '/auth/signin',
    '/auth/signup', 
    '/auth/error',
    '/api/auth'
  ]

  // Static assets and Next.js internal routes
  const staticRoutes = [ // Updated to cover more static paths else than just /_next/static which are by default public; all these are not accessible through urls directly
    '/_next', 
    '/favicon.ico',
    '/public',
    '/__nextjs'
  ]

  // Check if route is public or static
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  const isStaticRoute = staticRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute || isStaticRoute) {
    console.log('Public/Static route allowed:', pathname)
    return NextResponse.next()
  }

  // PROTECT ALL OTHER ROUTES (including profile, settings, tasks)
  if (!isAuthenticated) {
    console.log('BLOCKED - Redirecting to signin:', pathname)
    
    const signInUrl = new URL('/auth/signin', origin)
    signInUrl.searchParams.set('callbackUrl', pathname)
    
    return NextResponse.redirect(signInUrl)
  }

  console.log('Authenticated access granted:', pathname)
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ]
}