// File: packages/portal/middleware.ts (Next.js 13+)

import { NextRequest, NextResponse } from 'next/server';
import { getSubdomain } from 'common/src/utils/resolveTenant';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const subdomain = getSubdomain(host);

  if (subdomain) {
    const url = req.nextUrl.clone();
    url.searchParams.set('tenant', subdomain);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
