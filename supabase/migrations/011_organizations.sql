create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   text references users(id),
  created_at timestamptz default now()
);

create table org_members (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references organizations(id) on delete cascade,
  user_id   text not null references users(id),
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);

create table org_items (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  type         text not null check (type in ('skill', 'template')),
  name         text not null,
  description  text,
  content_path text,
  pinned       boolean not null default false,
  created_by   text references users(id),
  created_at   timestamptz default now()
);

alter table users add column if not exists org_id uuid references organizations(id);

create index org_members_org_id_idx on org_members(org_id);
create index org_members_user_id_idx on org_members(user_id);
create index org_items_org_id_idx on org_items(org_id);
