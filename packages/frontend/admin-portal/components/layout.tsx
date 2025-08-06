// File: packages/frontend/admin-portal/components/Layout.tsx

import React from 'react';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link> | <Link href="/tenants">Tenants</Link> |{' '}
        <Link href="/users">Users</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}