-- =====================================================================
-- NUTRIMETH BMS — Auth, Team & Creator Migration
-- Run this in Supabase SQL Editor AFTER the base schema
-- =====================================================================

-- ─── 1. user_profiles table ──────────────────────────────────────────
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name, email, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, user_profiles.full_name),
    email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── 2. Add creator columns to all tables (safe: only if missing) ────

-- clients
alter table clients add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table clients add column if not exists creator_name text;
alter table clients add column if not exists creator_email text;

-- suppliers
alter table suppliers add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table suppliers add column if not exists creator_name text;
alter table suppliers add column if not exists creator_email text;

-- products
alter table products add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table products add column if not exists creator_name text;
alter table products add column if not exists creator_email text;

-- sales
alter table sales add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table sales add column if not exists creator_name text;
alter table sales add column if not exists creator_email text;

-- purchases
alter table purchases add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table purchases add column if not exists creator_name text;
alter table purchases add column if not exists creator_email text;

-- expenses
alter table expenses add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table expenses add column if not exists creator_name text;
alter table expenses add column if not exists creator_email text;

-- expense_types
alter table expense_types add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table expense_types add column if not exists creator_name text;
alter table expense_types add column if not exists creator_email text;

-- purchase_types
alter table purchase_types add column if not exists creator_id uuid references auth.users(id) on delete set null;
alter table purchase_types add column if not exists creator_name text;
alter table purchase_types add column if not exists creator_email text;

-- ─── 3. Disable RLS (app uses anon key; team data is shared) ─────────
alter table user_profiles disable row level security;
alter table clients disable row level security;
alter table suppliers disable row level security;
alter table products disable row level security;
alter table expense_types disable row level security;
alter table purchase_types disable row level security;
alter table sales disable row level security;
alter table purchases disable row level security;
alter table expenses disable row level security;
alter table company_settings disable row level security;

-- ─── 4. Enable Realtime for user_profiles ────────────────────────────
alter publication supabase_realtime add table user_profiles;

-- ─── 5. Indexes ───────────────────────────────────────────────────────
create index if not exists idx_clients_creator_id on clients(creator_id);
create index if not exists idx_suppliers_creator_id on suppliers(creator_id);
create index if not exists idx_products_creator_id on products(creator_id);
create index if not exists idx_sales_creator_id on sales(creator_id);
create index if not exists idx_purchases_creator_id on purchases(creator_id);
create index if not exists idx_expenses_creator_id on expenses(creator_id);
