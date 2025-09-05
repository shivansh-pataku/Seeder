// middleware.js (ROOT DIRECTORY)
import { auth } from './src/app/api/auth/[...nextauth]/route.js'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  console.log('🛡️ Middleware - Path:', pathname, 'Auth:', isAuthenticated)

  // Allow public routes
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup', 
    '/auth/error',
    '/api/auth',
    '/favicon.ico',
    '/_next',
    '/public'
  ]

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    console.log('✅ Public route allowed:', pathname)
    return NextResponse.next()
  }

  // Protect API routes (except auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!isAuthenticated) {
      console.log('❌ API route blocked - no auth:', pathname)
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Protect main app routes
  if (pathname === '/' || pathname.startsWith('/tasks') || pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      console.log('❌ Protected route blocked - redirecting to signin:', pathname)
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  console.log('✅ Route allowed:', pathname)
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}