-- 0004 — functions & triggers  (docs/03.5, 03.6)

-- Anonymous, atomic listen counter (docs/05.10). Client debounces to 1/session.
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

-- RLS helper (docs/04.3).
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- updated_at maintenance.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_categories_updated   before update on categories
  for each row execute function set_updated_at();
create trigger trg_summaries_updated     before update on summaries
  for each row execute function set_updated_at();
create trigger trg_site_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- Arabic full-text search vector (docs/03.6, ADR-007). Uses 'simple' + unaccent.
-- Includes key-idea titles and body paragraphs (gap-review fix G3).
create or replace function summaries_tsv(s summaries)
returns tsvector language sql immutable as $$
  select
    setweight(to_tsvector('simple', unaccent(coalesce(s.title,  ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(s.author, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(s.teaser, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(
       (select string_agg(idea->>'title', ' ')
          from jsonb_array_elements(s.key_ideas) as idea), ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(
       (select string_agg(para, ' ')
          from jsonb_array_elements_text(s.body_paragraphs) as para), ''))), 'C');
$$;

create or replace function summaries_tsv_trigger()
returns trigger language plpgsql as $$
begin new.search_tsv := summaries_tsv(new); return new; end; $$;

create trigger trg_summaries_tsv before insert or update on summaries
  for each row execute function summaries_tsv_trigger();
