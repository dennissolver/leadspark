-- tenants
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  config_json jsonb,
  stripe_customer_id text,
  subscription_status text,
  current_plan_id text,
  created_at timestamp default now()
);

-- users
create table users (
  id uuid primary key,
  tenant_id uuid references tenants(id),
  role text check (role in ('superadmin', 'client')),
  created_at timestamp default now()
);

-- leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  investment_goals text,
  source text,
  created_at timestamp default now()
);

-- conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  lead_id uuid references leads(id),
  transcript_json jsonb,
  created_at timestamp default now()
);

-- knowledge_base
create table knowledge_base (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  title text,
  content text,
  type text,
  url text,
  file_path text,
  tags text[],
  created_at timestamp default now()
);

-- RLS
alter table tenants enable row level security;
alter table users enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table knowledge_base enable row level security;

-- RLS policies
create policy "Users can view their tenant" on tenants
  for select using (auth.uid() in (select id from users where users.tenant_id = tenants.id));

create policy "Clients access own leads" on leads
  for all using (auth.uid() in (select id from users where users.tenant_id = leads.tenant_id));

create policy "Clients access own conversations" on conversations
  for all using (auth.uid() in (select id from users where users.tenant_id = conversations.tenant_id));

create policy "Clients access own KB" on knowledge_base
  for all using (auth.uid() in (select id from users where users.tenant_id = knowledge_base.tenant_id));
