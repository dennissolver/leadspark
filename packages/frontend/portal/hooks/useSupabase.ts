// File: packages/frontend/portal/hooks/useSupabase.ts

import { supabase } from '../lib/supabaseClient';

export function useSupabase() {
  return supabase;
}
