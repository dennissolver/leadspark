CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config_json JSONB DEFAULT '{}',
  subscription_status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS config_json JSONB DEFAULT '{}';
