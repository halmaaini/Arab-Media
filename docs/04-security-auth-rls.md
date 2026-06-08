# 04 — Security, Auth & Row-Level Security

Security model in one sentence: **the public app uses the Supabase anon key in
the browser, and Row-Level Security (RLS) is the only thing standing between
anonymous visitors and the data** — so RLS must be correct on every table before
any real data exists.

## 4.1 Keys & where they live

| Key | Where | May appear in client bundle? |
|-----|-------|------------------------------|
| `anon` key (`VITE_SUPABASE_ANON_KEY`) | Browser (public app + admin) | ✅ Yes — it is public by design; safe **only because RLS is on**. |
| `service_role` key | Seed script / CI only (`scripts/seed.mjs`) | ❌ **Never.** Bypasses RLS. Not a `VITE_` var. |
| Admin login credentials | Entered at runtime; exchanged for a session JWT | ❌ Never hardcoded. |

> **Hard rule:** any env var prefixed `VITE_` is embedded in the public bundle.
> The service-role key must **not** carry that prefix and must not be imported by
> anything under `src/`.

## 4.2 Authentication (admin only — D3)

- Provider: **Supabase Auth, email + password.** Create the owner's user once in
  the Supabase dashboard (or via an invite); insert their `auth.users.id` into
  `admins`.
- The public app never calls auth — visitors are anonymous.
- Admin login (`/owner` login screen) calls
  `supabase.auth.signInWithPassword({ email, password })`. On success, store
  nothing manually — supabase-js persists the session; subscribe to
  `onAuthStateChange`.
- **Route guard:** all `owner-*` routes require (a) an active session **and**
  (b) `is_admin()` true. If not, redirect to the login screen. (Belt &
  braces: RLS already blocks writes even if the UI guard is bypassed.)
- Logout: `supabase.auth.signOut()`.
- Session: default Supabase JWT (1h) with refresh. Enforce a sensible
  inactivity behaviour in the UI; do not build "remember me forever".
- **Remove the prototype's fake login** entirely (it accepts any input).

## 4.3 RLS policies (per table)

Enable RLS on **every** table, then add policies. (Supabase: RLS-on with no
policy = deny-all.)

```sql
alter table categories    enable row level security;
alter table summaries     enable row level security;
alter table messages      enable row level security;
alter table site_settings enable row level security;
alter table admins        enable row level security;
alter table play_events   enable row level security;
```

### categories — public read, admin write
```sql
create policy categories_read_all   on categories for select using (true);
create policy categories_admin_write on categories for all
  using (is_admin()) with check (is_admin());
```

### summaries — public reads ONLY published; admin sees/does everything
```sql
create policy summaries_public_read on summaries for select
  using (status = 'published');
create policy summaries_admin_read  on summaries for select
  using (is_admin());                       -- admin also sees drafts/archived
create policy summaries_admin_write on summaries for all
  using (is_admin()) with check (is_admin());
```
> The `listens` counter is bumped via the `increment_listens` **RPC**
> (security definer) — there is intentionally **no** public UPDATE policy on
> `summaries`.

### messages — anyone may INSERT (contact form); only admin may read/manage
```sql
create policy messages_anon_insert on messages for insert
  with check (true);                        -- length CHECKs + app captcha guard abuse
create policy messages_admin_read  on messages for select using (is_admin());
create policy messages_admin_update on messages for update
  using (is_admin()) with check (is_admin());
create policy messages_admin_delete on messages for delete using (is_admin());
```
> **No SELECT for anon** — a visitor must never read others' messages.

### site_settings — public read, admin update
```sql
create policy settings_read_all   on site_settings for select using (true);
create policy settings_admin_write on site_settings for update
  using (is_admin()) with check (is_admin());
```

### admins — not client-writable; readable only by admins
```sql
create policy admins_self_read on admins for select using (is_admin());
-- no insert/update/delete policies ⇒ only service_role (SQL/dashboard) manages rows
```

### play_events — insert via RPC/anon; read only admin
```sql
create policy play_events_anon_insert on play_events for insert with check (true);
create policy play_events_admin_read  on play_events for select using (is_admin());
```

## 4.4 Storage policies (buckets — full detail in doc 05)

- `covers`, `audio`: **public read** (content is meant to be public);
  **write/update/delete restricted to `is_admin()`** via storage RLS on
  `storage.objects`.
```sql
create policy "media public read" on storage.objects for select
  using (bucket_id in ('covers','audio'));
create policy "media admin write" on storage.objects for insert
  with check (bucket_id in ('covers','audio') and is_admin());
create policy "media admin modify" on storage.objects for update
  using (bucket_id in ('covers','audio') and is_admin());
create policy "media admin delete" on storage.objects for delete
  using (bucket_id in ('covers','audio') and is_admin());
```
> Draft media is "public by obscurity" (random path, unlinked). Acceptable for
> v1 (content is destined to be public). If stricter draft privacy is ever
> required, switch buckets to private + signed URLs — a scoped change, not v1.

## 4.5 Abuse / hardening checklist

- ☐ RLS enabled + policies present on **all** tables (verify with a deny test as
  anon — see doc 14).
- ☐ Contact form: Cloudflare **Turnstile** (or hCaptcha) token verified, plus a
  hidden honeypot field; column-length `CHECK`s in DB.
- ☐ Rate-limit message inserts (Supabase Edge Function or Turnstile is usually
  enough for v1; document the per-IP limit if added).
- ☐ Email confirmations disabled for the public app (no public signup at all —
  disable signups in Supabase Auth settings so only invited admins exist).
- ☐ CORS / allowed redirect URLs in Supabase restricted to the known domains.
- ☐ No `service_role` key reachable from `src/` (add a CI grep check).
- ☐ Content-Security-Policy headers via `vercel.json` (doc 11) limiting connect-src to Supabase + analytics.
- ☐ Sentry configured to scrub PII; no tokens in logs.
- ☐ Dependency audit (`npm audit`) clean of high/critical before launch.

## 4.6 Threat notes

| Threat | Mitigation |
|--------|------------|
| Anon tries to read drafts | `summaries_public_read` restricts to `published` |
| Anon tries to write/publish | No write policy for anon; admin-only `with check (is_admin())` |
| Anon scrapes messages | No anon SELECT on `messages` |
| Listen-count inflation | RPC + client debounce (1/session); acceptable residual risk for vanity metric |
| Spam via contact form | Turnstile + honeypot + length checks + (optional) rate limit |
| Leaked anon key | Harmless by design — RLS bounds it; rotate if desired |
| Leaked service_role key | Severe — kept out of bundle & client; rotate immediately if exposed |
