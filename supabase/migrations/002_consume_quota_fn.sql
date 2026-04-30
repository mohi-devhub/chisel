-- Atomic anonymous quota consume.
-- Inserts a new session (gen_count=1) or increments an existing one,
-- but only when gen_count < p_limit. The WHERE clause on DO UPDATE makes
-- the check + increment a single atomic operation, eliminating the race
-- condition that existed when check and consume were two separate queries.
create or replace function consume_anonymous_quota(
  p_fingerprint text,
  p_limit       integer
)
returns table (
  session_id  uuid,
  gen_count   integer,
  allowed     boolean
)
language plpgsql
as $$
declare
  v_id    uuid;
  v_count integer;
begin
  insert into anonymous_sessions (fingerprint, gen_count, last_seen_at)
  values (p_fingerprint, 1, now())
  on conflict (fingerprint)
  do update
     set gen_count    = anonymous_sessions.gen_count + 1,
         last_seen_at = now()
   where anonymous_sessions.gen_count < p_limit
  returning anonymous_sessions.id, anonymous_sessions.gen_count
  into v_id, v_count;

  if v_id is not null then
    -- Insert or conditional update succeeded: slot was available.
    return query select v_id, v_count, true;
  else
    -- WHERE blocked the update (already at/over limit): read current state.
    select s.id, s.gen_count
      into v_id, v_count
      from anonymous_sessions s
     where s.fingerprint = p_fingerprint;
    return query select v_id, v_count, false;
  end if;
end;
$$;
