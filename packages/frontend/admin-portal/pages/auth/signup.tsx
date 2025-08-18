// File: packages/frontend/admin-portal/pages/auth/signup.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '@leadspark/common/supabase'; // Corrected import path

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { supabase } = useSupabase(); // Correctly get the Supabase client from the hook

  async function handleSignup(e: any) {
    e.preventDefault();
    // The supabase object is now correctly defined here
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) router.push('/auth/login');
  }

  return (
    <form onSubmit={handleSignup}>
      <h2>Signup</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Signup</button>
    </form>
  );
}

