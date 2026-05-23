create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'tenant_demo',
  phone text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  entry_group text not null default 'despesas_variaveis',
  category text not null default 'sem categoria',
  description text,
  source_text text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.financial_entries
add column if not exists category text not null default 'sem categoria';

alter table public.financial_entries
add column if not exists entry_group text not null default 'despesas_variaveis';

update public.financial_entries
set entry_group = 'receitas'
where type = 'income';

update public.financial_entries
set entry_group = 'despesas_fixas'
where type = 'expense'
  and category in ('estrutura', 'marketing', 'sistema/ferramentas');

create index if not exists financial_entries_tenant_phone_date_idx
  on public.financial_entries (tenant_id, phone, occurred_at desc);

alter table public.financial_entries enable row level security;

grant usage on schema public to service_role;
grant select, insert on public.financial_entries to service_role;
