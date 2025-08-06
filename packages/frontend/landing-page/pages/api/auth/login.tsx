// File: packages/frontend/landing-page/pages/api/auth/login.ts

import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  const { email, password } = req.body;
  const { error, session } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return res.status(401).json({ error: error.message });
  res.status(200).json({ session });
}