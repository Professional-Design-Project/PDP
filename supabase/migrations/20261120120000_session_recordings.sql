insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,
  52428800,
  array['audio/webm', 'audio/ogg', 'audio/mp4']
)
on conflict (id) do nothing;

create policy "recordings of finished sessions can be saved by their owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.practice_sessions sessions
      where sessions.id::text = storage.filename(name)
        and sessions.user_id = (select auth.uid())
        and sessions.status in ('ended', 'failed')
    )
  );

create policy "recordings are readable by their owner"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "recordings can be deleted by their owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
