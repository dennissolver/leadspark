// File: packages/frontend/admin-portal/pages/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return <div>Redirecting to dashboard...</div>;
}