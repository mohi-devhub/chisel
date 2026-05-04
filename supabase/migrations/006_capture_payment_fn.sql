create or replace function capture_payment(
  p_order_id   text,
  p_payment_id text
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
   where razorpay_order_id = p_order_id
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
         razorpay_payment_id = p_payment_id
   where id = v_payment.id;

  return query select true, v_payment.plan, v_payment.user_id;
end;
$$;
