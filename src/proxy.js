import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/register'];

async function verifyAdmin(token) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return !!payload.roles?.admin;
  } catch {
    return false;
  }
}

export default async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const token = req.cookies.get('jwt_admin')?.value;
  const isAdmin = await verifyAdmin(token);

  if (isPublic) {
    if (isAdmin) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  if (!isAdmin) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)',
  ],
};