-- Track Dodo subscription ID on payments for lifecycle event handling
alter table payments
  add column if not exists dodo_subscription_id text,
  add column if not exists checkout_url text;

create unique index if not exists payments_dodo_subscription_id_key
  on payments(dodo_subscription_id)
  where dodo_subscription_id is not null;
