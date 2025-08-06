// File: packages/frontend/portal/pages/index.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function PortalHome() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    };
    getSession();
  }, [router]);

  if (!user) return <p>Loading...</p>;

  return <h1>Welcome to Your Portal, {user.email}</h1>;
}