# 03 — Data Model (Postgres / Supabase)

This is the **authoritative schema**. Implement it as numbered SQL migrations in
`supabase/migrations/` (see doc 11). RLS policies live in `04-security-auth-rls.md`
but are referenced here per table. All timestamps are `timestamptz` (UTC).

## 3.1 Entity overview

```
categories ──1:N── summaries ──N:1── (palette_key enum, no table)
                       │
                       ├── key_ideas        : jsonb [{title, body}]   (ADR-005)
                       ├── body_paragraphs  : jsonb [string]          (ADR-005)
                       ├── cover_path        ─────────────▶ Storage: covers/
                       └── audio_path         ────────────▶ Storage: audio/
messages        (standalone — contact form inbox)
site_settings   (singleton — publisher profile, contact, defaults)
admins          (allowlist of admin auth users; drives is_admin())
play_events     (optional, anonymous analytics)
```

## 3.2 Enums

```sql
create type summary_status as enum ('draft', 'published', 'archived');
create type message_status as enum ('new', 'read', 'archived');
create type palette_key   as enum ('ink','jade','plum','rust','navy','olive','wine','teal');
```

> `palette_key` mirrors the 8 design palettes in `src/data.js` (`P.*`). The
> palette **colour values stay in the front-end** as design tokens; the DB only
> stores which palette a summary uses (used to render the generated-cover
> fallback when `cover_path is null`).

## 3.3 Tables

### `categories`
Keeps the human slug as PK (UI + existing data key on it).

```sql
create table categories (
  id          text primary key,                 -- slug: 'self','psych',…
  name        text not null,                     -- 'تطوير الذات'
  blurb       text,                              -- short description
  icon        text,                              -- optional icon key (front-end)
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### `summaries`
The core content unit (the prototype's "book").

```sql
create table summaries (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,          -- 'atomic-habits' (URL key)
  title                   text not null,
  author                  text not null,
  category_id             text not null references categories(id) on delete restrict,
  tags                    text[] not null default '{}',
  teaser                  text,                          -- one-line hook
  key_ideas               jsonb not null default '[]',   -- [{ "title": str, "body": str }]  (was {t,x})
  body_paragraphs         jsonb not null default '[]',   -- [str, str, …]  (was fullText)
  palette_key             palette_key not null default 'ink',
  cover_path              text,                          -- Storage path; null ⇒ generated cover
  audio_path              text,                          -- Storage path to mp3/m4a; null ⇒ "audio coming soon"
  audio_duration_seconds  int,                           -- real duration; null until audio uploaded
  listens                 int not null default 0,
  featured                boolean not null default false,
  is_new                  boolean not null default false,
  status                  summary_status not null default 'draft',
  published_at            timestamptz,                   -- set when first published
  search_tsv              tsvector,                      -- maintained by trigger (3.6)
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
```

**Business rules (enforced in app; see “publish guard” 3.7):**
- A summary may only be **published** if it has `title`, `author`,
  `category_id`, a non-empty `teaser`, ≥ 3 `key_ideas`, and non-empty
  `body_paragraphs`. (Audio is *recommended* but not blocking — see migration
  note below.)
- The 15 **seeded** summaries are `published` with `audio_path = null`
  (no recordings exist yet). UI shows "الصوت قيد الإعداد" and disables play; the
  read tab works. This preserves the current live catalogue while narration is
  produced. New summaries created via the admin should have audio before
  publish (soft warning, not a hard block, for v1).

**`key_ideas` jsonb element shape** — note this **fixes a prototype gap**: the
old editor captured only the idea *title* (`t`); the detail view needs both
title and explanation.
```json
{ "title": "العادات هي الفائدة المركّبة لتطوير الذات",
  "body":  "كما يتراكم المال بالفائدة المركّبة، تتراكم آثار عاداتك…" }
```

### `messages`
Contact-form submissions. **No public read** (privacy).

```sql
create table messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name)  between 1 and 120),
  email       text not null check (char_length(email) between 3 and 200),
  subject     text not null check (char_length(subject) between 1 and 200),
  body        text not null check (char_length(body)  between 1 and 5000),
  status      message_status not null default 'new',
  created_at  timestamptz not null default now()
);
```
> Length `CHECK`s are the first line of anti-abuse. Layer a Cloudflare
> Turnstile/honeypot at the app (doc 08) and consider a per-IP rate limit
> (doc 04). Do **not** store IP/UA unless a privacy notice covers it (doc 10).

### `site_settings`
Singleton row (id = 1). Replaces the hardcoded `OWNER` object and admin Settings.

```sql
create table site_settings (
  id                      int primary key default 1 check (id = 1),
  publisher_name          text,
  publisher_role          text,
  publisher_title_line    text,
  publisher_location      text,
  publisher_bio           jsonb not null default '[]',  -- [paragraph, …]
  publisher_philosophy    text,
  publisher_avatar_path   text,                          -- Storage (optional)
  socials                 jsonb not null default '{}',   -- {twitter,linkedin,instagram,youtube}
  contact_email           text,
  contact_phone           text,
  contact_location        text,
  default_speed           numeric(3,2) not null default 1.0,
  default_theme           text not null default 'light',
  updated_at              timestamptz not null default now()
);
```
> **Derived stats** (Publisher/About pages) are **computed at query time**
> (`count(*)` of published summaries, categories) — never stored. This kills the
> "16 vs 15" drift in both `pages.jsx` (fixed) and `OWNER.stats` (still
> hardcoded today).

### `admins`
Allowlist that drives the `is_admin()` RLS helper. Rows are inserted **manually
via SQL/dashboard**, never from the client.

```sql
create table admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
```

### `play_events` *(optional — analytics; ship in Phase 5 or rely on Vercel Analytics)*
Anonymous. No PII. One row per qualifying play.

```sql
create table play_events (
  id                bigint generated always as identity primary key,
  summary_id        uuid references summaries(id) on delete cascade,
  occurred_at       timestamptz not null default now(),
  session_hash      text,            -- rotating, non-identifying (doc 10)
  seconds_listened  int,
  completed         boolean not null default false
);
```

## 3.4 Indexes

```sql
create index summaries_status_pub_idx on summaries (status, published_at desc);
create index summaries_category_idx   on summaries (category_id);
create index summaries_featured_idx   on summaries (featured) where status = 'published';
create index summaries_listens_idx    on summaries (listens desc) where status = 'published';
create index summaries_tags_gin       on summaries using gin (tags);
create index summaries_search_gin     on summaries using gin (search_tsv);
create index summaries_title_trgm     on summaries using gin (title gin_trgm_ops);   -- requires pg_trgm
create index messages_status_idx      on messages (status, created_at desc);
create index play_events_summary_idx  on play_events (summary_id, occurred_at desc);
```

Extensions to enable (migration 0001):
```sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;
-- gen_random_uuid() is provided by pgcrypto (preinstalled on Supabase)
```

## 3.5 RPCs / functions

### `increment_listens(p_summary uuid)` — anonymous, atomic
```sql
create or replace function increment_listens(p_summary uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update summaries set listens = listens + 1
  where id = p_summary and status = 'published';
$$;
revoke all on function increment_listens(uuid) from public;
grant execute on function increment_listens(uuid) to anon, authenticated;
```
> Client debounces: **at most one call per summary per session**, fired only
> after a meaningful play threshold (doc 05/08). `security definer` lets anon
> bump the counter without a broad UPDATE policy on `summaries`.

### `is_admin()` — RLS helper
```sql
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
```

### `set_updated_at()` — trigger
```sql
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_categories_updated   before update on categories
  for each row execute function set_updated_at();
create trigger trg_summaries_updated     before update on summaries
  for each row execute function set_updated_at();
create trigger trg_site_settings_updated before update on site_settings
  for each row execute function set_updated_at();
```

## 3.6 Full-text search (Arabic) — ADR-007

```sql
create or replace function summaries_tsv(s summaries)
returns tsvector language sql immutable as $$
  select
    setweight(to_tsvector('simple', unaccent(coalesce(s.title,  ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(s.author, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(s.teaser, ''))), 'B') ||
    -- key-idea titles (search must hit them; was previously omitted)
    setweight(to_tsvector('simple', unaccent(coalesce(
       (select string_agg(idea->>'title', ' ')
          from jsonb_array_elements(s.key_ideas) as idea), ''))), 'B') ||
    -- full body paragraphs
    setweight(to_tsvector('simple', unaccent(coalesce(
       (select string_agg(para, ' ')
          from jsonb_array_elements_text(s.body_paragraphs) as para), ''))), 'C');
$$;

create or replace function summaries_tsv_trigger()
returns trigger language plpgsql as $$
begin new.search_tsv := summaries_tsv(new); return new; end; $$;

create trigger trg_summaries_tsv before insert or update on summaries
  for each row execute function summaries_tsv_trigger();
```
> Query with `websearch_to_tsquery('simple', unaccent(:q))` against `search_tsv`,
> plus a `title ILIKE %q%` / trigram fallback for short partial terms. Tags are
> matched separately via the GIN array index. Keep numerals Latin in indexed
> text. (If results quality is poor for Arabic morphology, a v2 option is the
> `arabic` snowball config or an external search service — out of scope now.)

## 3.7 Publish guard (optional DB-side hardening)

App enforces publish requirements (doc 07). For defense-in-depth you **may** add:
```sql
alter table summaries add constraint published_needs_content check (
  status <> 'published' or (
    title <> '' and author <> '' and coalesce(teaser,'') <> ''
    and jsonb_array_length(key_ideas) >= 3
    and jsonb_array_length(body_paragraphs) >= 1
  )
);
```
> Note: this does **not** require `audio_path` (seeded rows have none). Keep
> audio a soft, app-level warning for v1.

## 3.8 Seed mapping (`data.js` → tables) — see doc 09 for the runner

| `data.js` | Table.column | Transform |
|-----------|--------------|-----------|
| `CATEGORIES[].id/name/blurb` | `categories.id/name/blurb` | direct; `sort_order` = array index |
| `BOOKS[].id` | `summaries.slug` | direct (string slug) |
| `BOOKS[].title/author/teaser` | same | direct |
| `BOOKS[].cat` | `summaries.category_id` | direct (FK) |
| `BOOKS[].tags` | `summaries.tags` | direct array |
| `BOOKS[].keyIdeas[{t,x}]` | `summaries.key_ideas[{title,body}]` | rename `t→title`, `x→body` |
| `BOOKS[].fullText[]` | `summaries.body_paragraphs` | direct array |
| `BOOKS[].palette` (object) | `summaries.palette_key` | invert `P` map → key name (ink/jade/…) |
| `BOOKS[].dur` | `summaries.audio_duration_seconds` | keep as provisional duration; will be overwritten by the real file’s duration when audio is uploaded |
| `BOOKS[].listens` | `summaries.listens` | direct |
| `BOOKS[].date` | `summaries.published_at` | parse ISO → timestamptz |
| `BOOKS[].featured/isNew` | `summaries.featured/is_new` | direct |
| — | `summaries.status` | `'published'` |
| — | `summaries.audio_path/cover_path` | `null` (none exist yet) |
| `OWNER.*` | `site_settings.*` | name/role/titleLine/location/bio/philosophy → columns |
| `OWNER.stats` | — | **dropped** (now derived counts) |
| contact constants (email/phone/location in `pages.jsx`) | `site_settings.contact_*` | direct |
| `MESSAGES[]` | `messages` | dev/staging only (sample data); **do not** seed into prod |
