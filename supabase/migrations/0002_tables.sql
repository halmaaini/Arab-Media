-- 0002 — tables  (docs/03.3)

create table categories (
  id          text primary key,                 -- slug: 'self','psych',…
  name        text not null,
  blurb       text,
  icon        text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table summaries (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  title                   text not null,
  author                  text not null,
  category_id             text not null references categories(id) on delete restrict,
  tags                    text[] not null default '{}',
  teaser                  text,
  key_ideas               jsonb not null default '[]',   -- [{title, body}]
  body_paragraphs         jsonb not null default '[]',   -- [string, …]
  palette_key             palette_key not null default 'ink',
  cover_path              text,                          -- null ⇒ generated cover
  audio_path              text,                          -- null ⇒ "audio coming soon"
  audio_duration_seconds  int,
  listens                 int not null default 0,
  featured                boolean not null default false,
  is_new                  boolean not null default false,
  status                  summary_status not null default 'draft',
  published_at            timestamptz,
  search_tsv              tsvector,                      -- maintained by trigger (0004)
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Defense-in-depth publish guard (docs/03.7). App enforces this too (docs/07.4).
-- Intentionally does NOT require audio_path (seeded rows have none — docs/09.3).
alter table summaries add constraint published_needs_content check (
  status <> 'published' or (
    title <> '' and author <> '' and coalesce(teaser,'') <> ''
    and jsonb_array_length(key_ideas) >= 3
    and jsonb_array_length(body_paragraphs) >= 1
  )
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name)    between 1 and 120),
  email       text not null check (char_length(email)   between 3 and 200),
  subject     text not null check (char_length(subject) between 1 and 200),
  body        text not null check (char_length(body)    between 1 and 5000),
  status      message_status not null default 'new',
  created_at  timestamptz not null default now()
);

create table site_settings (
  id                      int primary key default 1 check (id = 1),
  publisher_name          text,
  publisher_role          text,
  publisher_title_line    text,
  publisher_location      text,
  publisher_bio           jsonb not null default '[]',
  publisher_philosophy    text,
  publisher_avatar_path   text,
  socials                 jsonb not null default '{}',
  contact_email           text,
  contact_phone           text,
  contact_location        text,
  default_speed           numeric(3,2) not null default 1.0,
  default_theme           text not null default 'light',
  updated_at              timestamptz not null default now()
);

-- Allowlist that drives is_admin(). Rows inserted manually via SQL/dashboard only
-- (docs/04.2, 11.2) — there is intentionally no client insert policy (0005).
create table admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Optional anonymous analytics (docs/03.3, 10.2). Ship in Phase 5 if used.
create table play_events (
  id                bigint generated always as identity primary key,
  summary_id        uuid references summaries(id) on delete cascade,
  occurred_at       timestamptz not null default now(),
  session_hash      text,            -- non-identifying, rotates per session
  seconds_listened  int,
  completed         boolean not null default false
);
