update users set tier = 'free' where tier not in ('free', 'solo', 'team_owner', 'team_member');

alter table users add constraint users_tier_check
  check (tier in ('free', 'solo', 'team_owner', 'team_member'));
