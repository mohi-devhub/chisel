-- Users table (id matches Clerk user ID)
create table users (
  id                  uuid primary key,
  email               text not null unique,
  tier                text not null default 'free', -- 'free' | 'creator' | 'pro'
  gen_count           integer not null default 0,
  monthly_gen_count   integer not null default 0,
  monthly_reset_at    timestamptz default now(),
  credits             integer not null default 0,
  trial_ends_at       timestamptz,
  created_at          timestamptz default now()
);

-- Skills table (all generated skills)
create table skills (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id),
  name          text not null,
  description   text not null,
  storage_path  text not null,
  structure     jsonb,
  created_at    timestamptz default now()
);

-- Marketplace listings (published skills)
create table marketplace_listings (
  id              uuid primary key default gen_random_uuid(),
  skill_id        uuid references skills(id),
  author_id       uuid references users(id),
  name            text not null,
  description     text not null,
  tags            text[],
  category        text,
  download_count  integer default 0,
  storage_path    text not null,
  published_at    timestamptz default now()
);

-- Anonymous sessions (fingerprint-based quota tracking)
create table anonymous_sessions (
  id            uuid primary key default gen_random_uuid(),
  fingerprint   text not null unique,
  gen_count     integer not null default 0,
  created_at    timestamptz default now(),
  last_seen_at  timestamptz default now()
);

-- Payments (Razorpay order + payment records)
create table payments (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references users(id),
  razorpay_order_id       text not null,
  razorpay_payment_id     text,
  plan                    text not null,
  status                  text not null default 'pending',
  created_at              timestamptz default now()
);

-- Indexes for common queries
create index skills_user_id_idx on skills(user_id);
create index marketplace_listings_author_id_idx on marketplace_listings(author_id);
create index marketplace_listings_published_at_idx on marketplace_listings(published_at desc);
create index payments_user_id_idx on payments(user_id);
create index anonymous_sessions_fingerprint_idx on anonymous_sessions(fingerprint);
