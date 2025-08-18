-- supabase/migrations/2025-08-11-update-users.sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{tenant_id}',
  '"default_tenant"',
  true
)
WHERE raw_user_meta_data->>'tenant_id' IS NULL;