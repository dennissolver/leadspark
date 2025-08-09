// packages/frontend/portal/hooks/useSupabase.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User, SupabaseClient } from '@supabase/supabase-js'
import { getBrowserClient } from '@/utils/supabase/client'

type SupabaseContextValue = {
  supabase: SupabaseClient
  session: Session | null
  user: User | null
  tenantId: string | null
  loading: boolean
  signOut: () => Promise<{ error: Error | null }>
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null)

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

function getTenantIdFromUser(user: User | null): string | null {
  if (!user) return null
  const um = isRecord(user.user_metadata) ? user.user_metadata : null
  if (um && typeof um['tenant_id'] === 'string' && um['tenant_id']) return um['tenant_id'] as string
  const am = isRecord(user.app_metadata) ? user.app_metadata : null
  if (am && typeof am['tenant_id'] === 'string' && am['tenant_id']) return am['tenant_id'] as string
  return null
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getBrowserClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return
      setSession(sess ?? null)
      setUser(sess?.user ?? null)
    })

    return () => {
      mounted = false
      sub?.subscription.unsubscribe()
    }
  }, [supabase])

  const tenantId = useMemo(() => getTenantIdFromUser(user), [user])

  const signOut = async () => {
    // instant UI update
    setSession(null)
    setUser(null)
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  }

  const value: SupabaseContextValue = {
    supabase,
    session,
    user,
    tenantId,
    loading,
    signOut,
    signInWithOtp,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

/** Named hook (context consumer) */
export function useSupabase() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used within <SupabaseProvider>')
  return ctx
}

/** Only need the client? */
export function useSupabaseClient() {
  return useSupabase().supabase
}

/** Default export for backwards compatibility */
export default useSupabase

