// packages/common/src/utils/supabase/supabaseClient.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import type { GetServerSidePropsContext } from 'next';
import { SerializeOptions } from 'cookie';
import { serialize } from 'cookie';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ---------- BROWSER ----------
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ---------- PAGES ROUTER SSR ----------
function appendSetCookieHeader(ctx: GetServerSidePropsContext, value: string) {
  const current = ctx.res.getHeader('Set-Cookie');
  if (!current) {
    ctx.res.setHeader('Set-Cookie', value);
  } else if (Array.isArray(current)) {
    ctx.res.setHeader('Set-Cookie', [...current, value]);
  } else {
    ctx.res.setHeader('Set-Cookie', [String(current), value]);
  }
}

export function createSupabaseServerClient(ctx: GetServerSidePropsContext) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        // Pages Router: cookies are plain object on req
        return ctx.req.cookies?.[name];
      },
      set(name: string, value: string, options: CookieSerializeOptions) {
        const cookie = serialize(name, value, { path: '/', ...options });
        appendSetCookieHeader(ctx, cookie);
      },
      remove(name: string, options: CookieSerializeOptions) {
        const cookie = serialize(name, '', { path: '/', maxAge: 0, ...options });
        appendSetCookieHeader(ctx, cookie);
      },
    },
  });
}
