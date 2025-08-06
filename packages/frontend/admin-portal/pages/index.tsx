// File: packages/frontend/admin-portal/pages/index.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
      } else {
        setUser(session.user);
      }
    });
  }, [router]);

  if (!user) return <p>Loading...</p>;

  return <h1>Welcome to LeadSpark Admin, {user.email}</h1>;
}