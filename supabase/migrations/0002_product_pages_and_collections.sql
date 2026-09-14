-- =============================================================
-- DAWANA — product pages + products in many collections
-- Run after 0001. Paste into Supabase → SQL Editor → Run.
-- Safe to run again.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Product page addresses: /products/<slug>
-- -------------------------------------------------------------
alter table public.products add column if not exists slug text;

-- Backfill from the name; a clash gets the SKU appended.
with base as (
  select id, sku,
         coalesce(nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''),
                  lower(sku)) as s
  from public.products
  where slug is null
),
ranked as (
  select id, sku, s, row_number() over (partition by s order by id) as n from base
)
update public.products p
set slug = case
  when r.n = 1 and not exists (select 1 from public.products o where o.slug = r.s)
    then r.s
  else r.s || '-' || trim(both '-' from regexp_replace(lower(r.sku), '[^a-z0-9]+', '-', 'g'))
end
from ranked r
where p.id = r.id;

alter table public.products alter column slug set not null;
create unique index if not exists products_slug_key on public.products (slug);

-- -------------------------------------------------------------
-- 2. A product can sit in any number of collections
-- -------------------------------------------------------------
create table if not exists public.product_collections (
  product_id     uuid not null references public.products(id)    on delete cascade,
  collection_id  uuid not null references public.collections(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (product_id, collection_id)
);

create index if not exists product_collections_collection_idx
  on public.product_collections (collection_id);

-- Carry over the old single-collection link, then retire the column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'collection_id'
  ) then
    insert into public.product_collections (product_id, collection_id)
    select id, collection_id from public.products where collection_id is not null
    on conflict do nothing;

    alter table public.products drop column collection_id;
  end if;
end $$;

-- -------------------------------------------------------------
-- 3. Security: the public sees a link only when both ends are published
-- -------------------------------------------------------------
alter table public.product_collections enable row level security;

drop policy if exists product_collections_public_read on public.product_collections;
create policy product_collections_public_read on public.product_collections
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p    where p.id = product_id    and p.is_published)
    and exists (select 1 from public.collections c where c.id = collection_id and c.is_published)
  );

grant select on public.product_collections to anon, authenticated;
revoke insert, update, delete, truncate on public.product_collections from anon, authenticated;
grant all on public.product_collections to service_role;

-- Done. Check with:  select slug, name from public.products;
