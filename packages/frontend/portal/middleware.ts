import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

// 👇 add/adjust protected sections as needed
const PROTECTED_MATCHERS = [
  '/dashboard',
  '/leads',
  '/settings',
  '/knowledge-base',
  '/billing',
] as const

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_MATCHERS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function getTenantIdFromUser(user: User | null): string | null {
  if (!user) return null

  // Safely read from user_metadata (current) or app_metadata (legacy)
  const um = user.user_metadata
  if (um && typeof um.tenant_id === 'string' && um.tenant_id.length) return um.tenant_id

  const am = user.app_metadata
  if (am && typeof am.tenant_id === 'string' && am.tenant_id.length) return am.tenant_id

  return null
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl

  // Skip public paths early.
  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required Supabase environment variables')
    return NextResponse.redirect(new URL('/error', req.url))
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({
              name,
              value,
              ...options,
            })
          })
        },
        remove(name: string, options = {}) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // This is the line to modify for debugging
  // Comment out this block to allow access to protected pages without a session.
  if (!user) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // All good, continue to the requested page
  return res
}

// ✅ Only run middleware where we need it
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/settings/:path*',
    '/knowledge-base/:path*',
    '/billing/:path*',
  ],
}
