import { NextResponse, type NextRequest } from 'next/server'
import { RADAR_AUTH_COOKIE, verifyAuthToken } from '@/lib/radar-auth'

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/robots.txt',
  '/favicon.ico',
  '/icon',
  '/apple-icon',
  '/_next',
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const isAuthenticated = await verifyAuthToken(request.cookies.get(RADAR_AUTH_COOKIE)?.value)
  if (isAuthenticated) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('next', `${pathname}${search}`)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!.*\\..*).*)', '/api/:path*', '/robots.txt'],
}
