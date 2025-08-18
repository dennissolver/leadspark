'use client';

import { useEffect, useState } from 'react';

export default function ClientOnlySupabaseProvider({ children }: { children: React.ReactNode }) {
  const [Provider, setProvider] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      import('@leadspark/common/src/utils/supabase/useSupabase')
        .then((module) => {
          setProvider(() => module.SupabaseProvider);
          setMounted(true);
        })
        .catch((error) => {
          console.error('Failed to load SupabaseProvider:', error);
          setMounted(true);
        });
    }
  }, []);

  // During SSR or before provider loads, render children without provider
  if (!mounted || !Provider) {
    return <>{children}</>;
  }

  // Once provider is loaded, wrap children
  return <Provider>{children}</Provider>;
}