-- Clerk user IDs are strings like "user_...", not UUIDs.
-- This migration keeps existing UUID-shaped data readable while allowing
-- future Clerk IDs to be stored directly.
alter table marketplace_listings drop constraint if exists marketplace_listings_author_id_fkey;
alter table skills drop constraint if exists skills_user_id_fkey;
alter table payments drop constraint if exists payments_user_id_fkey;

alter table users alter column id type text using id::text;
alter table skills alter column user_id type text using user_id::text;
alter table marketplace_listings alter column author_id type text using author_id::text;
alter table payments alter column user_id type text using user_id::text;

alter table skills
  add constraint skills_user_id_fkey
  foreign key (user_id) references users(id);

alter table marketplace_listings
  add constraint marketplace_listings_author_id_fkey
  foreign key (author_id) references users(id);

alter table payments
  add constraint payments_user_id_fkey
  foreign key (user_id) references users(id);
