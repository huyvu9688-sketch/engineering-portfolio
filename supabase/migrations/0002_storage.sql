-- Public-read bucket, 50 MB per-file cap.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', true, 52428800)
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Anyone may download; only admins may write.
create policy "documents bucket public read"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "documents bucket admin insert"
  on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_admin());

create policy "documents bucket admin update"
  on storage.objects for update
  using (bucket_id = 'documents' and public.is_admin());

create policy "documents bucket admin delete"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin());
