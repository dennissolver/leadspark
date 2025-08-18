import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// Protected paths
const PROTECTED_MATCHERS = [
  '/dashboard',
  '/leads',
  '/settings',
  '/knowledge-base',
  '/billing',
] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_MATCHERS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getTenantIdFromUser(user: User | null): string | null {
  if (!user) return null;

  // Safely read from user_metadata (current) or app_metadata (legacy)
  const um = user.user_metadata;
  if (um && typeof um.tenant_id === 'string' && um.tenant_id.length) return um.tenant_id;

  const am = user.app_metadata;
  if (am && typeof am.tenant_id === 'string' && am.tenant_id.length) return am.tenant_id;

  return null;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Skip public paths early
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required Supabase environment variables');
    return NextResponse.redirect(new URL('/error', req.url));
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string): string | undefined {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: { [key: string]: any }): void {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: { [key: string]: any }): void {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Log error if getUser fails
  if (error) {
    console.error('Error fetching user:', error.message);
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to login if no user is found
  if (!user) {
    console.warn('No user found, redirecting to login');
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Optional: Check tenant ID if required
  const tenantId = getTenantIdFromUser(user);
  if (!tenantId) {
    console.warn('No tenant ID found for user:', user.id);
    // Allow access without tenant ID (modify as needed)
    // Alternatively, redirect to a tenant selection page or handle differently
  }

  // All good, continue to the requested page
  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/settings/:path*',
    '/knowledge-base/:path*',
    '/billing/:path*',
  ],
};