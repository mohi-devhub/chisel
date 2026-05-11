create unique index if not exists payments_dodo_checkout_session_id_key
  on payments(dodo_checkout_session_id)
  where dodo_checkout_session_id is not null;
