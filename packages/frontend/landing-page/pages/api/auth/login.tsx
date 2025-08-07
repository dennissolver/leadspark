// pages/api/auth/login.tsx
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body exists
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Attempt login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    });

    if (error) {
      // Log the actual error for debugging (server-side only)
      console.error('Supabase auth error:', error);

      // Return generic error message to client for security
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Successful login
    return res.status(200).json({
      success: true,
      session: data.session,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata
      }
    });

  } catch (error) {
    // Log unexpected errors
    console.error('Login API error:', error);

    // Return generic error message
    return res.status(500).json({
      error: 'An unexpected error occurred'
    });
  }
}