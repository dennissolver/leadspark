// File: packages/frontend/admin-portal/pages/auth/signup.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleSignup(e: any) {
    e.preventDefault();
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