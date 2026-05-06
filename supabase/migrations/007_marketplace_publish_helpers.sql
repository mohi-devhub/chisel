create unique index if not exists marketplace_listings_skill_id_unique_idx
  on marketplace_listings(skill_id);

create or replace function increment_marketplace_download_count(listing_id uuid)
returns void
language sql
as $$
  update marketplace_listings
  set download_count = coalesce(download_count, 0) + 1
  where id = listing_id;
$$;
