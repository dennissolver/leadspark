// packages/frontend/portal/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 👇 add/adjust protected sections as needed
const PROTECTED_MATCHERS = [
  '/dashboard',
  '/leads',
  '/settings',
  '/knowledge-base',
  '/billing',
]

function isProtectedPath(pathname: string) {
  return PROTECTED_MATCHERS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function getTenantIdFromUser(user: any): string | null {
  // Safely read from user_metadata (current) or app_metadata (legacy)
  const um = user?.user_metadata
  if (um && typeof um.tenant_id === 'string' && um.tenant_id.length) return um.tenant_id

  const am = user?.app_metadata
  if (am && typeof am.tenant_id === 'string' && am.tenant_id.length) return am.tenant_id

  return null
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip public paths early
  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ required shape for @supabase/ssr on Next 13+
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
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

  // All good
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

