// Add this line to the top of your middleware.ts file
const VERIFY_VERSION: number = "This is the wrong type and will cause a build to fail";


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

  // Skip public paths early. The matcher in `config` handles this for most cases,
  // but this is a good additional check for clarity.
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

  // The cookie functions required by createServerClient - Updated API
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options = {}) {
          res.cookies.set({
            name,
            value,
            ...options,
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

  // Not signed in ➜ /login
  if (!user) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname) // optional: return after login
    return NextResponse.redirect(url)
  }

  // Signed in but no tenant ➜ /onboarding
  const tenantId = getTenantIdFromUser(user)
  if (!tenantId && !pathname.startsWith('/onboarding')) {
    const url = new URL('/onboarding', req.url)
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