create or replace function consume_user_quota(p_user_id text)
returns table (
  allowed        boolean,
  remaining      integer,
  effective_tier text,
  reason         text
)
language plpgsql
as $$
declare
  v_user        users%rowtype;
  v_cap         integer;
  v_monthly     integer;
  v_reset_month boolean;
begin
  select *
    into v_user
    from users
   where id = p_user_id
   for update;

  if not found then
    return query select false, 0, 'free'::text, 'missing_user'::text;
    return;
  end if;

  if v_user.trial_ends_at is not null and v_user.trial_ends_at > now() then
    effective_tier := 'creator';
  else
    effective_tier := v_user.tier;
  end if;

  if effective_tier = 'free' then
    return query select false, 0, effective_tier, 'plan_required'::text;
    return;
  end if;

  v_cap := case when effective_tier = 'pro' then 100 else 30 end;
  v_reset_month := coalesce(v_user.monthly_reset_at, now()) <= now() - interval '30 days';
  v_monthly := case when v_reset_month then 0 else v_user.monthly_gen_count end;

  if v_monthly < v_cap then
    update users
       set gen_count = gen_count + 1,
           monthly_gen_count = v_monthly + 1,
           monthly_reset_at = case when v_reset_month then now() else monthly_reset_at end
     where id = p_user_id
     returning * into v_user;

    return query select true, greatest(v_cap - v_user.monthly_gen_count, 0), effective_tier, null::text;
    return;
  end if;

  if v_user.credits > 0 then
    update users
       set gen_count = gen_count + 1,
           credits = credits - 1
     where id = p_user_id
     returning * into v_user;

    return query select true, v_user.credits, effective_tier, null::text;
    return;
  end if;

  return query select false, 0, effective_tier, 'monthly_limit'::text;
end;
$$;
