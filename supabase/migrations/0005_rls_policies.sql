-- 0005 — Row-Level Security  (docs/04.3)
-- RLS-on with no policy = deny-all. Enable on every table, then add policies.

alter table categories    enable row level security;
alter table summaries     enable row level security;
alter table messages      enable row level security;
alter table site_settings enable row level security;
alter table admins        enable row level security;
alter table play_events   enable row level security;

-- categories: public read, admin write
create policy categories_read_all    on categories for select using (true);
create policy categories_admin_write on categories for all
  using (is_admin()) with check (is_admin());

-- summaries: public reads ONLY published; admin reads/writes everything
create policy summaries_public_read on summaries for select
  using (status = 'published');
create policy summaries_admin_read  on summaries for select
  using (is_admin());
create policy summaries_admin_write on summaries for all
  using (is_admin()) with check (is_admin());
-- listens is bumped via increment_listens() RPC — no public UPDATE policy here.

-- messages: NO anon insert (gap-review fix G1 / ADR-009). Inserts happen only
-- through the verified submit-message function using the service role (which
-- bypasses RLS). Admin reads/manages.
create policy messages_admin_read   on messages for select using (is_admin());
create policy messages_admin_update on messages for update
  using (is_admin()) with check (is_admin());
create policy messages_admin_delete on messages for delete using (is_admin());

-- site_settings: public read, admin update
create policy settings_read_all    on site_settings for select using (true);
create policy settings_admin_write on site_settings for update
  using (is_admin()) with check (is_admin());

-- admins: readable only by admins; no client writes (service_role/SQL manages)
create policy admins_self_read on admins for select using (is_admin());

-- play_events: anon may insert (via RPC/app); only admin reads
create policy play_events_anon_insert on play_events for insert with check (true);
create policy play_events_admin_read  on play_events for select using (is_admin());
