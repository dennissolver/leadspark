// File: packages/frontend/landing-page/hooks/useSupabase.ts

import { supabase } from '../lib/supabaseClient';

export function useSupabase() {
  return supabase;
}