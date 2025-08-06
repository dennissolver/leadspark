// File: packages/portal/pages/_app.tsx (tenant-aware layout example)

import '@/styles/base/_reset.scss';
import '@/styles/layout/_layout.scss';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const { query } = useRouter();
  const tenant = query.tenant as string | undefined;

  return (
    <div className={`app-tenant-${tenant ?? 'default'}`}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;


-- Supabase SQL (migrations/2025-08-06-init.sql additions)

create table tenants (
  id uuid primary key default uuid_generate_v4(),
  subdomain text unique not null, -- e.g., 'propertyfriends'
  name text not null,
  plan text not null default 'free',
  config jsonb, -- stores agent ID, theme color, etc.
  created_at timestamp default now()
);

insert into tenants (subdomain, name, plan, config) values (
  'propertyfriends',
  'Property Friends',
  'pro',
  '{"agent_id": "agent_01xyz", "logo_url": "/logo.png", "theme_color": "#125D98"}'
);


-- Vault Convention (human-readable)
# Secrets will be stored in Vault at:
# vault/secrets/tenants/propertyfriends/elevenlabs
# vault/secrets/tenants/propertyfriends/supabase
# vault/secrets/tenants/propertyfriends/openai
