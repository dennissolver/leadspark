import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/api/webhooks',
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // If user is not signed in and trying to access protected route
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_LANDING_URL}/login`, req.url);
    redirectUrl.searchParams.set('redirect', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in but doesn't have tenant_id, redirect to onboarding
  if (session && !isPublicRoute) {
    const user = session.user;
    const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;

    if (!tenantId && pathname !== '/onboarding') {
      // Redirect to landing page for tenant setup
      const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_LANDING_URL}/onboarding`, req.url);
      redirectUrl.searchParams.set('redirect', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If user is on index page and authenticated, redirect to dashboard
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Add security headers
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (adjust based on your needs)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for CSS modules
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
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
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};