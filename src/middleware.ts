import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup', '/find-account', '/reset-password', '/complete-signup', '/api/auth/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/presets') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow guest mode (except admin routes)
  const guestMode = request.cookies.get('guest-mode')?.value;
  if (guestMode === '1' && !pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Handle ?guest=1 from login page
  if (request.nextUrl.searchParams.get('guest') === '1') {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('guest-mode', '1', { path: '/', maxAge: 60 * 60 * 24 }); // 1 day
    return response;
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
