# Supabase — migrations & seed

Implements Phase 0 + ticket P1-0 from `docs/`. See `docs/03-data-model.md`,
`docs/04-security-auth-rls.md`, `docs/09-migration-and-seed.md`,
`docs/11-environments-and-cicd.md`.

## Apply order (forward-only)
1. `migrations/0001_extensions_enums.sql`
2. `migrations/0002_tables.sql`
3. `migrations/0003_indexes.sql`
4. `migrations/0004_functions_triggers.sql`
5. `migrations/0005_rls_policies.sql`
6. `migrations/0006_storage.sql`

Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor,
**dev project first**, then prod. Never edit an applied migration — add a new one.

## After migrations: bootstrap + seed
- **Create the admin user** (Dashboard → Authentication) and
  `insert into admins (user_id) values ('<auth user id>');` (docs/11.2). No client
  path exists — `admins` has no insert policy.
- **Seed content:** `node scripts/seed.mjs` (ticket P1-1 — to be written) loads
  `seed/content.json` using the **service-role** key (env, never committed). Do
  **not** seed the sample `messages` into prod.

## What `seed/content.json` is
A committed snapshot of the 15 legacy summaries + 9 categories + publisher/contact
settings, already transformed to the schema (`t→title`, `x→body`, palette→
`palette_key`, `fullText→body_paragraphs`). Regenerate with
`node scripts/extract-seed.mjs` **only while `src/data.js` still exists** (it is
deleted in ticket P1-8); thereafter the committed JSON is the source.

## Validation status
- `0001–0004` + the publish `CHECK` + the FTS function/trigger + all 15 seed
  inserts + `increment_listens` were validated locally against a real Postgres
  (PGlite). 
- `0005` (RLS) and `0006` (storage) are Supabase-specific (need `auth`/`storage`
  schemas + `anon`/`authenticated` roles); validate them on Supabase with the
  anon deny-tests in `docs/14-acceptance-and-dod.md` §14.1.
- `pg_trgm`/`unaccent` and the `summaries_title_trgm` index require the
  extensions in `0001` (present on Supabase).

## Credentials needed (owner)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client), `SUPABASE_SERVICE_ROLE_KEY`
(seed/CI only — never a `VITE_` var, never in the bundle). See `.env.example`
(ticket P0-9) and `docs/11`.
