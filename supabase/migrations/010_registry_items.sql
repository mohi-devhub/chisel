create table registry_items (
  id            uuid primary key default gen_random_uuid(),
  author_id     text references users(id),
  type          text not null check (type in ('skill', 'template')),
  name          text not null,
  description   text not null,
  tags          text[],
  stack         text[],
  category      text,
  content_path  text,
  install_count integer not null default 0,
  published_at  timestamptz default now()
);

create index registry_items_author_id_idx on registry_items(author_id);
create index registry_items_type_idx on registry_items(type);
create index registry_items_stack_idx on registry_items using gin(stack);
create index registry_items_published_at_idx on registry_items(published_at desc);
