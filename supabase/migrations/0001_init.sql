-- =============================================================
-- DAWANA — full database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run again: every statement is idempotent.
-- =============================================================

-- -------------------------------------------------------------
-- 0. Leftovers from the earlier email-based admin (no-ops on a fresh project)
-- -------------------------------------------------------------
drop function if exists public.is_admin() cascade;
drop function if exists public.can_write() cascade;
drop table if exists public.admin_users cascade;

-- -------------------------------------------------------------
-- 1. Helpers
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- 2. Control-room accounts (username + password, no email)
--    Passwords are scrypt hashes made by the app — never plain text.
--    Only the server (service-role key) can read or write this table.
-- -------------------------------------------------------------
create table if not exists public.admin_accounts (
  id               uuid primary key default gen_random_uuid(),
  username         text not null check (username ~ '^[A-Za-z0-9._-]{3,32}$'),
  username_key     text generated always as (lower(username)) stored,
  full_name        text,
  role             text not null default 'editor'
                   check (role in ('developer','admin','editor')),
  password_hash    text not null,
  is_active        boolean not null default true,
  session_version  int not null default 1,
  failed_attempts  int not null default 0,
  locked_until     timestamptz,
  last_login_at    timestamptz,
  created_by       uuid references public.admin_accounts(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists admin_accounts_username_key
  on public.admin_accounts (username_key);

-- No accounts are seeded in this public file. The first logins were created
-- privately at setup; everyone after that is added from Team access in the
-- admin. To create a first account by hand, hash a password with the app's
-- scrypt format (see src/lib/auth/password.ts) and insert a 'developer' row.

-- -------------------------------------------------------------
-- 3. Catalogue
-- -------------------------------------------------------------
create table if not exists public.collections (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  description       text,
  therapeutic_area  text,
  accent            text,
  cover_url         text,
  position          int  not null default 0,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists collections_published_idx
  on public.collections (is_published, position);

create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  collection_id      uuid references public.collections(id) on delete set null,
  sku                text not null unique,
  name               text not null,
  generic_name       text,
  strength           text,
  form               text,
  pack_size          text,
  description        text,
  therapeutic_area   text,
  manufacturer       text,
  country_of_origin  text,
  registration_no    text,
  price              numeric(12,3),
  currency           text not null default 'KWD',
  stock              int not null default 0,
  image_url          text,
  is_published       boolean not null default false,
  is_featured        boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists products_collection_idx on public.products (collection_id);
create index if not exists products_published_idx  on public.products (is_published);
create index if not exists products_area_idx       on public.products (therapeutic_area);
create index if not exists products_search_idx on public.products
  using gin (to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(generic_name,'') || ' ' ||
    coalesce(sku,'')  || ' ' || coalesce(manufacturer,'')));

create table if not exists public.partners (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  country      text,
  website      text,
  logo_url     text,
  blurb        text,
  position     int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 4. Documents: receipts / contracts / proposals
--    References read DW-RCP-2026-0001, numbered per type per year.
-- -------------------------------------------------------------
create table if not exists public.doc_counters (
  kind  text not null,
  year  int  not null,
  seq   int  not null default 0,
  primary key (kind, year)
);

create or replace function public.next_doc_seq(p_kind text, p_year int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq int;
begin
  insert into public.doc_counters (kind, year, seq)
  values (p_kind, p_year, 1)
  on conflict (kind, year)
    do update set seq = public.doc_counters.seq + 1
  returning seq into v_seq;
  return v_seq;
end;
$$;

create table if not exists public.receipts (
  id              uuid primary key default gen_random_uuid(),
  ref             text not null unique,
  seq             int  not null,
  payment_date    date not null default current_date,
  from_party      jsonb not null default '{}'::jsonb,
  bill_to         jsonb not null default '{}'::jsonb,
  items           jsonb not null default '[]'::jsonb,
  payment_method  text not null default 'Cash',
  currency        text not null default 'KWD',
  tax_rate        numeric(5,2) not null default 0,
  notes           text,
  authorized_by   text,
  status          text not null default 'draft'
                  check (status in ('draft','sent','paid','void')),
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.contracts (
  id               uuid primary key default gen_random_uuid(),
  ref              text not null unique,
  seq              int  not null,
  title            text not null,
  counterparty     jsonb not null default '{}'::jsonb,
  effective_date   date not null default current_date,
  end_date         date,
  jurisdiction     text not null default 'State of Kuwait',
  value            numeric(14,3),
  currency         text not null default 'KWD',
  clauses          jsonb not null default '[]'::jsonb,
  signatory_name   text,
  signatory_title  text,
  status           text not null default 'draft'
                   check (status in ('draft','sent','signed','void','expired')),
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.proposals (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique,
  seq            int  not null,
  title          text not null,
  client         jsonb not null default '{}'::jsonb,
  prepared_by    text,
  valid_until    date,
  summary        text,
  sections       jsonb not null default '[]'::jsonb,
  deliverables   jsonb not null default '[]'::jsonb,
  currency       text not null default 'KWD',
  tax_rate       numeric(5,2) not null default 0,
  status         text not null default 'draft'
                 check (status in ('draft','sent','signed','void','expired')),
  created_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists receipts_created_idx  on public.receipts (created_at desc);
create index if not exists contracts_created_idx on public.contracts (created_at desc);
create index if not exists proposals_created_idx on public.proposals (created_at desc);

-- "Created by" points at the control-room account that saved the document.
do $$
declare t text;
begin
  foreach t in array array['receipts','contracts','proposals'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_created_by_fkey');
    execute format(
      'alter table public.%I add constraint %I foreign key (created_by)
       references public.admin_accounts(id) on delete set null', t, t || '_created_by_fkey');
  end loop;
end $$;

-- -------------------------------------------------------------
-- 5. Website enquiries (written by the server, read in the admin)
-- -------------------------------------------------------------
create table if not exists public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  organisation  text,
  subject       text,
  message       text not null,
  handled       boolean not null default false,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists contact_unhandled_idx
  on public.contact_messages (handled, created_at desc);

-- -------------------------------------------------------------
-- 6. updated_at triggers
-- -------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'admin_accounts','collections','products','receipts','contracts','proposals','partners'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.touch_updated_at();', t, t);
  end loop;
end $$;

-- =============================================================
-- 7. ROW LEVEL SECURITY
--    The public (anon key) can only READ published catalogue rows.
--    Every write goes through the Next.js server with the service-role
--    key after it has checked the admin session, and the service role
--    bypasses RLS — so no write policies exist for anyone else.
-- =============================================================
alter table public.admin_accounts   enable row level security;
alter table public.collections      enable row level security;
alter table public.products         enable row level security;
alter table public.partners         enable row level security;
alter table public.receipts         enable row level security;
alter table public.contracts        enable row level security;
alter table public.proposals        enable row level security;
alter table public.contact_messages enable row level security;
alter table public.doc_counters     enable row level security;

-- Clear any policies from earlier versions of this file.
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('admin_accounts','collections','products','partners','receipts',
                        'contracts','proposals','contact_messages','doc_counters')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy collections_public_read on public.collections
  for select to anon, authenticated using (is_published);

create policy products_public_read on public.products
  for select to anon, authenticated using (is_published);

create policy partners_public_read on public.partners
  for select to anon, authenticated using (is_published);

-- Belt and braces: the public roles hold no privileges at all on private tables.
revoke all on public.admin_accounts, public.receipts, public.contracts, public.proposals,
              public.contact_messages, public.doc_counters
  from anon, authenticated;

-- The public site reads the catalogue (RLS above narrows it to published rows).
grant usage on schema public to anon, authenticated;
grant select on public.collections, public.products, public.partners to anon, authenticated;

-- And can't write the catalogue even if a policy were added by mistake.
revoke insert, update, delete, truncate on public.collections, public.products, public.partners
  from anon, authenticated;

-- Document numbering is server-only.
revoke execute on function public.next_doc_seq(text, int) from public, anon, authenticated;
grant  execute on function public.next_doc_seq(text, int) to service_role;

grant all on public.admin_accounts, public.collections, public.products, public.partners,
             public.receipts, public.contracts, public.proposals,
             public.contact_messages, public.doc_counters
  to service_role;

-- Done. Check with:  select username, role, is_active from public.admin_accounts;
