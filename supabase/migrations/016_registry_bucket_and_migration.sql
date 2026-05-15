-- Registry items: track which storage bucket holds the content so we can sign
-- URLs across the new chisel-registry bucket and legacy chisel-marketplace.
alter table registry_items
  add column if not exists bucket text not null default 'chisel-registry';

-- Atomic install-count increment used by the download endpoint.
create or replace function increment_registry_install_count(item_id uuid)
returns void
language sql
set search_path = public
as $$
  update registry_items
  set install_count = coalesce(install_count, 0) + 1
  where id = item_id;
$$;

-- Backfill: copy existing marketplace listings into the registry as type='skill'.
-- Reuse the marketplace_listings.id so deep links remain stable; mark the
-- bucket as chisel-marketplace so downloads still resolve from the legacy
-- storage objects.
insert into registry_items (
  id,
  author_id,
  type,
  name,
  description,
  tags,
  stack,
  category,
  content_path,
  bucket,
  install_count,
  published_at
)
select
  ml.id,
  ml.author_id,
  'skill',
  ml.name,
  ml.description,
  ml.tags,
  array[]::text[],
  ml.category,
  ml.storage_path,
  'chisel-marketplace',
  coalesce(ml.download_count, 0),
  ml.published_at
from marketplace_listings ml
where not exists (
  select 1 from registry_items r where r.id = ml.id
);
