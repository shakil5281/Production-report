import { NextRequest, NextResponse } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/daily-production', 
  '/production-reports',
  '/profit-loss',
  '/admin',
  '/super-admin'
];

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/api/auth/sign-in', '/api/auth/sign-up'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if it's a protected route
  if (isProtectedRoute(pathname)) {
    return await handleProtectedRoute(request);
  }

  return NextResponse.next();
}

async function handleProtectedRoute(request: NextRequest): Promise<NextResponse> {
  const token = extractToken(request);
  
  if (!token) {
    return redirectToLogin(request);
  }

  // Let the page/API route handle the actual token validation
  // This avoids Edge Runtime compatibility issues with bcrypt/jsonwebtoken
  return NextResponse.next();
}

function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const token = request.cookies.get('auth-token')?.value;
  return token || null;
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
