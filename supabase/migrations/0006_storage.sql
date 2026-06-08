-- 0006 — storage buckets + policies  (docs/04.4, 05.1)
-- Public-read buckets; write/modify/delete restricted to admins.

insert into storage.buckets (id, name, public) values
  ('audio',  'audio',  true),
  ('covers', 'covers', true)
on conflict (id) do nothing;
-- ('avatars','avatars',true) optional — add if publisher avatar upload is built.

-- File-size / MIME limits are also enforced client-side (docs/05.1):
--   audio  ≤ 200 MB  (audio/mpeg, audio/mp4, audio/x-m4a)
--   covers ≤ 2 MB    (image/jpeg, image/png, image/webp)
-- Supabase per-bucket limits may be set via the dashboard/management API.

create policy "media public read" on storage.objects for select
  using (bucket_id in ('covers','audio'));

create policy "media admin write" on storage.objects for insert
  with check (bucket_id in ('covers','audio') and is_admin());

create policy "media admin modify" on storage.objects for update
  using (bucket_id in ('covers','audio') and is_admin());

create policy "media admin delete" on storage.objects for delete
  using (bucket_id in ('covers','audio') and is_admin());
