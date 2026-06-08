# 09 — Data Migration & Seed

Goal: move the 15 summaries, 9 categories, owner profile, and contact constants
from `src/data.js` into Supabase **without losing the live catalogue**, then
retire `data.js`. Sample `MESSAGES` go to dev/staging only.

## 9.1 Seed runner

`scripts/seed.mjs` — a Node ESM script run locally/CI (never in the browser).

- Uses the **service-role** key (env `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_URL`) — bypasses RLS for the one-off load. **Not** a `VITE_` var.
- Imports the existing `src/data.js` (or a copied snapshot) to read
  `CATEGORIES`, `BOOKS`, `OWNER`, the `P` palette map, and the contact constants.
- **Idempotent:** upsert on natural keys (`categories.id`, `summaries.slug`,
  `site_settings.id=1`) so re-running doesn't duplicate.
- Order: extensions/schema migrations first (doc 11) → categories → site_settings
  → summaries → (dev only) messages.

## 9.2 Transform rules (authoritative table is in doc 03.8)
- `keyIdeas[{t,x}]` → `key_ideas[{title,body}]` (rename keys).
- `fullText[]` → `body_paragraphs[]`.
- `palette` object → `palette_key`: invert the `P` map by reference/structural
  equality to recover the key (`ink`,`jade`,…). If a book's palette can't be
  matched, fail loudly (don't silently default).
- `date` (ISO) → `published_at` (timestamptz). `status='published'`.
- `dur` → `audio_duration_seconds` (provisional; real value set when audio is
  uploaded later). `audio_path=null`, `cover_path=null`.
- `listens`, `featured`, `isNew` → direct.
- `OWNER.name/role/titleLine/location/bio/philosophy` → `site_settings.*`.
  `OWNER.stats` → **dropped** (derived). Contact email/phone/location (from
  `pages.jsx`) → `site_settings.contact_*`; socials → `site_settings.socials`.

## 9.3 Audio/cover for seeded summaries
- None exist. Seeded rows stay published with `audio_path=null` → UI shows
  "الصوت قيد الإعداد", play disabled, **read tab fully works** (doc 05.13).
- The owner later uploads audio per summary via the admin (doc 07.4); that sets
  `audio_path` + real `audio_duration_seconds` and enables playback. No reseed needed.

## 9.4 Verification (must pass before cutover)
- Row counts: `categories = 9`, `summaries = 15`, all `status='published'`.
- Spot-check 3 summaries: title/author/teaser, `key_ideas` length & that each has
  **both** title and body, `body_paragraphs` length, `palette_key` correct.
- `getDerivedStats()` returns `{summaries:15, categories:9}` (the number the
  About/Publisher pages will show — confirms the "16" is gone for good).
- Public anon query returns the 15; a deliberately-created `draft` is **not**
  visible to anon (RLS check).

## 9.5 Cutover (public app: data.js → DB)
1. Land Phase 0 (schema/RLS/buckets) on `main`; run seed against **prod** project.
2. Point public pages at `src/api/*` (doc 06). Keep `data.js` in the repo.
3. Deploy to a **preview** first; verify every public route renders from the DB
   and matches the current live site (parity check, doc 14).
4. Promote to production (merge to `main`).
5. After 24–48 h of stable prod, **delete `src/data.js`** and any imports; add a
   CI grep asserting nothing imports it. (Keep the original under
   `project/` history / git, not in `src`.)

## 9.6 Rollback
- Cutover is reversible until step 5: revert the commit pointing pages at the API
  to fall back to `data.js`. Because seeded content mirrors `data.js`, the user
  sees no difference either way.
- Seed mistakes: because the load is idempotent upserts, fix the transform and
  re-run; for a clean slate use a `truncate ... restart identity cascade` in a
  dev project only (never prod without a backup).

## 9.7 Backups
- Enable Supabase automated backups (or `pg_dump` before the prod seed and before
  the `data.js` deletion). Document the restore step in `11-environments-and-cicd.md`.
