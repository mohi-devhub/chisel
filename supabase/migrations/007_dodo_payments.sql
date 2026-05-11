alter table payments
  add column if not exists provider text not null default 'dodo',
  add column if not exists dodo_checkout_session_id text,
  add column if not exists dodo_payment_id text;

do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'payments'
       and column_name = 'razorpay_order_id'
  ) then
    alter table payments alter column razorpay_order_id drop not null;
  end if;
end $$;

create unique index if not exists payments_dodo_checkout_session_id_key
  on payments(dodo_checkout_session_id)
  where dodo_checkout_session_id is not null;

create unique index if not exists payments_dodo_payment_id_key
  on payments(dodo_payment_id)
  where dodo_payment_id is not null;

create or replace function capture_dodo_payment(
  p_checkout_session_id text,
  p_payment_id           text
)
returns table (
  handled boolean,
  plan    text,
  user_id text
)
language plpgsql
as $$
declare
  v_payment payments%rowtype;
begin
  select *
    into v_payment
    from payments
   where (
           p_checkout_session_id is not null
           and dodo_checkout_session_id = p_checkout_session_id
         )
      or (
           p_payment_id is not null
           and dodo_payment_id = p_payment_id
         )
   for update;

  if not found then
    return query select false, null::text, null::text;
    return;
  end if;

  if v_payment.status = 'paid' then
    return query select true, v_payment.plan, v_payment.user_id;
    return;
  end if;

  if v_payment.plan = 'credit_pack' then
    update users
       set credits = credits + 20
     where id = v_payment.user_id;
  elsif v_payment.plan = 'creator_monthly' then
    update users
       set tier = 'creator',
           monthly_gen_count = 0,
           monthly_reset_at = now()
     where id = v_payment.user_id;
  elsif v_payment.plan in ('pro_monthly', 'pro_annual') then
    update users
       set tier = 'pro',
           monthly_gen_count = 0,
           monthly_reset_at = now()
     where id = v_payment.user_id;
  else
    raise exception 'Unsupported payment plan: %', v_payment.plan;
  end if;

  update payments
     set status = 'paid',
         provider = 'dodo',
         dodo_payment_id = p_payment_id
   where id = v_payment.id;

  return query select true, v_payment.plan, v_payment.user_id;
end;
$$;
