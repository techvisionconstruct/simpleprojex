import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Redirect logged-in users from login to templates page
  if ((pathname.startsWith('/signin') || pathname.startsWith('/signup')) && authToken) {
    const url = new URL('/v1/templates', request.url)
    return NextResponse.redirect(url)
  }

  // Allow access to public pages without authentication
  if (
    pathname === '/' || 
    pathname.startsWith('/onboard') || 
    pathname.startsWith('/signin') || 
    pathname.startsWith('/signup') ||
    pathname.startsWith('/mockup') ||
    pathname.includes('/client')
  ) {
    return NextResponse.next()
  }
  
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.includes('/assets') ||
    pathname.includes('.svg') ||
    pathname.includes('.ico')
  ) {
    return NextResponse.next()
  }

  // Check if authToken looks like a JWT (three dot-separated parts)
  const isLikelyJWT = authToken && authToken.split('.').length === 3;

  if (!authToken || !isLikelyJWT) {
    const url = new URL('/signin', request.url);
    return NextResponse.redirect(url);
  }

  // Add the Authorization header to the request
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Authorization', `Bearer ${authToken}`)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}