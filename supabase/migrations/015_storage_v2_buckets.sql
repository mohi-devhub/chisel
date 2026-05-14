insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('chisel-registry',  'chisel-registry',  true,  10485760, array['application/zip','text/plain','text/markdown']),
  ('chisel-workspace', 'chisel-workspace', false, 10485760, array['application/zip','text/plain','text/markdown'])
on conflict (id) do nothing;

create policy "Public can read registry files"
  on storage.objects for select
  using (bucket_id = 'chisel-registry');
