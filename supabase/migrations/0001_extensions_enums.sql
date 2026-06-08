-- 0001 — extensions + enums  (docs/03.2)
-- Apply on Supabase (dev then prod). gen_random_uuid() comes from pgcrypto,
-- which is preinstalled on Supabase.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create type summary_status as enum ('draft', 'published', 'archived');
create type message_status as enum ('new', 'read', 'archived');
create type palette_key   as enum ('ink','jade','plum','rust','navy','olive','wine','teal');
