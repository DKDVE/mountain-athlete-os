insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'body_photos',
  'body_photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy body_photos_storage_sel on storage.objects
  for select to authenticated
  using (bucket_id = 'body_photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy body_photos_storage_ins on storage.objects
  for insert to authenticated
  with check (bucket_id = 'body_photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy body_photos_storage_upd on storage.objects
  for update to authenticated
  using (bucket_id = 'body_photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy body_photos_storage_del on storage.objects
  for delete to authenticated
  using (bucket_id = 'body_photos' and (storage.foldername(name))[1] = auth.uid()::text);
