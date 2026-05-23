alter table public.contacts
add column if not exists business_status text check (business_status in ('active_mei', 'starting_mei', 'unknown'));

alter table public.contacts
add column if not exists cnae text;

alter table public.contacts
add column if not exists segment text;

alter table public.contacts
add column if not exists preferred_checkin_time time;

alter table public.contacts
add column if not exists responsible_name text;

alter table public.contacts
add column if not exists profile_json jsonb not null default '{}'::jsonb;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant_demo',
  phone text not null,
  type text not null check (type in ('daily_checkin', 'das_due', 'das_overdue', 'payable_due', 'custom')),
  title text not null,
  message text not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled', 'done', 'failed')),
  recurrence_rule text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists reminders_due_idx
  on public.reminders (tenant_id, status, due_at);

create index if not exists reminders_tenant_phone_idx
  on public.reminders (tenant_id, phone, due_at desc);

create table if not exists public.obligations (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant_demo',
  phone text not null,
  type text not null check (type in ('das', 'dasn_simei', 'payable', 'custom')),
  title text not null,
  amount numeric(12, 2),
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'paid', 'overdue', 'cancelled')),
  period text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists obligations_due_idx
  on public.obligations (tenant_id, status, due_date);

create index if not exists obligations_tenant_phone_idx
  on public.obligations (tenant_id, phone, due_date desc);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant_demo',
  phone text not null,
  message_id text,
  media_type text not null check (media_type in ('audio', 'image', 'document', 'unknown')),
  provider text not null default 'evolution',
  mime_type text,
  remote_url text,
  storage_path text,
  transcription_text text,
  vision_text text,
  extracted_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed', 'ignored')),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists message_attachments_tenant_phone_idx
  on public.message_attachments (tenant_id, phone, created_at desc);

alter table public.reminders enable row level security;
alter table public.obligations enable row level security;
alter table public.message_attachments enable row level security;

grant usage on schema public to service_role;
grant select, insert, update on public.contacts to service_role;
grant select, insert, update on public.reminders to service_role;
grant select, insert, update on public.obligations to service_role;
grant select, insert, update on public.message_attachments to service_role;
