-- =============================================================
-- Dawana — initial schema
-- Run with:  supabase db push      (or paste into the SQL editor)
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Helpers
-- -------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin allow-list. Membership here (not merely being logged in) is what
-- grants write access, so an accidental public signup can never mutate data.
create table if not exists public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'editor' check (role in ('owner','admin','editor','viewer')),
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users a where a.id = auth.uid()
  );
$$;

create or replace function public.can_write()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users a
    where a.id = auth.uid() and a.role in ('owner','admin','editor')
  );
$$;

-- -------------------------------------------------------------
-- Collections
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

-- -------------------------------------------------------------
-- Products
-- -------------------------------------------------------------

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

-- Full-text search across the fields a rep would actually search by.
create index if not exists products_search_idx on public.products
  using gin (to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(generic_name,'') || ' ' ||
    coalesce(sku,'')  || ' ' || coalesce(manufacturer,'')));

-- -------------------------------------------------------------
-- Documents: receipts / contracts / proposals
-- Sequences are per-type and per-year so refs read DW-RCP-2026-0001.
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
  created_by      uuid references auth.users(id) on delete set null,
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
  created_by       uuid references auth.users(id) on delete set null,
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
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists receipts_created_idx  on public.receipts (created_at desc);
create index if not exists contracts_created_idx on public.contracts (created_at desc);
create index if not exists proposals_created_idx on public.proposals (created_at desc);

-- -------------------------------------------------------------
-- Contact messages (public insert, admin read)
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
-- Partners (drives the Partners page — no invented names in code)
-- -------------------------------------------------------------

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
-- updated_at triggers
-- -------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'collections','products','receipts','contracts','proposals','partners'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.touch_updated_at();', t, t);
  end loop;
end $$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.admin_users      enable row level security;
alter table public.collections      enable row level security;
alter table public.products         enable row level security;
alter table public.receipts         enable row level security;
alter table public.contracts        enable row level security;
alter table public.proposals        enable row level security;
alter table public.contact_messages enable row level security;
alter table public.partners         enable row level security;
alter table public.doc_counters     enable row level security;

-- admin_users: you may read your own row; only owners manage the list.
drop policy if exists admin_self_read on public.admin_users;
create policy admin_self_read on public.admin_users
  for select using (id = auth.uid());

-- Public catalogue: anonymous visitors see published rows only.
drop policy if exists collections_public_read on public.collections;
create policy collections_public_read on public.collections
  for select using (is_published or public.is_admin());

drop policy if exists collections_write on public.collections;
create policy collections_write on public.collections
  for all using (public.can_write()) with check (public.can_write());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (is_published or public.is_admin());

drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all using (public.can_write()) with check (public.can_write());

drop policy if exists partners_public_read on public.partners;
create policy partners_public_read on public.partners
  for select using (is_published or public.is_admin());

drop policy if exists partners_write on public.partners;
create policy partners_write on public.partners
  for all using (public.can_write()) with check (public.can_write());

-- Documents are admin-only in both directions — never publicly readable.
do $$
declare t text;
begin
  foreach t in array array['receipts','contracts','proposals'] loop
    execute format('drop policy if exists %I_admin_read on public.%I;', t, t);
    execute format(
      'create policy %I_admin_read on public.%I
       for select using (public.is_admin());', t, t);

    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format(
      'create policy %I_admin_write on public.%I
       for all using (public.can_write()) with check (public.can_write());', t, t);
  end loop;
end $$;

-- Contact: anyone may submit, only admins may read.
drop policy if exists contact_public_insert on public.contact_messages;
create policy contact_public_insert on public.contact_messages
  for insert with check (true);

drop policy if exists contact_admin_read on public.contact_messages;
create policy contact_admin_read on public.contact_messages
  for select using (public.is_admin());

drop policy if exists contact_admin_update on public.contact_messages;
create policy contact_admin_update on public.contact_messages
  for update using (public.can_write()) with check (public.can_write());

-- Counters are touched only through next_doc_seq (security definer).
drop policy if exists counters_admin_read on public.doc_counters;
create policy counters_admin_read on public.doc_counters
  for select using (public.is_admin());

-- =============================================================
-- STORAGE
-- =============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_admin_write on storage.objects;
create policy product_images_admin_write on storage.objects
  for all using (bucket_id = 'product-images' and public.can_write())
  with check (bucket_id = 'product-images' and public.can_write());

drop policy if exists documents_admin_all on storage.objects;
create policy documents_admin_all on storage.objects
  for all using (bucket_id = 'documents' and public.is_admin())
  with check (bucket_id = 'documents' and public.can_write());
