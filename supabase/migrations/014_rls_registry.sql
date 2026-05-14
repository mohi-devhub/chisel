alter table registry_items enable row level security;
alter table organizations enable row level security;
alter table org_members enable row level security;
alter table org_items enable row level security;

-- Registry: public read, authenticated insert
create policy "Anyone can view registry items"
  on registry_items for select using (true);

create policy "Authenticated users can publish registry items"
  on registry_items for insert to authenticated
  with check (author_id = auth.uid()::text);

-- Organizations: members can read their own org
create policy "Org members can view their organization"
  on organizations for select
  using (id in (
    select org_id from org_members where user_id = auth.uid()::text
  ));

-- Org members: members can read their org's member list
create policy "Org members can view members"
  on org_members for select
  using (org_id in (
    select org_id from org_members where user_id = auth.uid()::text
  ));

-- Org items: members can read, insert, delete
create policy "Org members can view items"
  on org_items for select
  using (org_id in (
    select org_id from org_members where user_id = auth.uid()::text
  ));

create policy "Org members can add items"
  on org_items for insert to authenticated
  with check (org_id in (
    select org_id from org_members where user_id = auth.uid()::text
  ));

create policy "Org members can delete items"
  on org_items for delete
  using (org_id in (
    select org_id from org_members where user_id = auth.uid()::text
  ));
