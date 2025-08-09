// utils/supabase/server.ts
import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const createClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        // The SSR helpers expect you to set cookies on response headers.
        set(name: string, value: string, opts: any) {
          // Next.js 14 pages router: you’ll typically set these in middleware (below).
          // On server actions/route handlers, you can also use cookies().set if available.
        },
        remove(name: string, opts: any) {
          // Same note as set(); middleware handles refresh path.
        }
      },
      // If you need header-based auth context on server actions/route handlers:
      headers: () => headers() as any
    }
  )
