# 13 — Task Backlog (ordered tickets for dev agents)

Execute in order within a phase. Each ticket: **id · title · what · acceptance ·
files**. Status legend: ☐ todo · ◐ wip · ☑ done · ⚠ blocked. A ticket is done
only when its acceptance criteria pass **and** the relevant `14-acceptance-and-dod.md`
items are green. Cross-references point to the spec doc that governs the detail.

---

## Phase 0 — Foundations

**P0-1 ☐ Create Supabase projects & CLI config**
- Create `arab-media-dev` + `arab-media-prod`; init Supabase CLI; commit `supabase/config.toml`.
- *Accept:* `supabase` CLI links to dev; config committed.
- *Files:* `supabase/config.toml`.

**P0-2 ☐ Migration: extensions + enums** (doc 03.2, 03.4)
- `pg_trgm`, `unaccent`; enums `summary_status`, `message_status`, `palette_key`.
- *Accept:* applies clean to dev; enums queryable.
- *Files:* `supabase/migrations/0001_extensions_enums.sql`.

**P0-3 ☐ Migration: tables** (doc 03.3)
- `categories, summaries, messages, site_settings, admins, play_events` exactly as specified.
- *Accept:* all tables exist with specified columns/defaults/checks/FKs.
- *Files:* `0002_tables.sql`.

**P0-4 ☐ Migration: indexes** (doc 03.4)
- *Accept:* all listed indexes present; `explain` uses them on sample queries.
- *Files:* `0003_indexes.sql`.

**P0-5 ☐ Migration: functions & triggers** (doc 03.5–3.6)
- `increment_listens`, `is_admin`, `set_updated_at`, FTS trigger; grants.
- *Accept:* `is_admin()` false for anon; `increment_listens` bumps a published row; `search_tsv` populates on insert/update.
- *Files:* `0004_functions_triggers.sql`.

**P0-6 ☐ Migration: RLS policies** (doc 04.3)
- Enable RLS + every policy listed.
- *Accept:* anon deny-tests (doc 14) pass; admin can CRUD after auth.
- *Files:* `0005_rls_policies.sql`.

**P0-7 ☐ Migration: storage buckets + policies** (doc 04.4, 05.1)
- Create `audio`, `covers` (+ optional `avatars`); public-read, admin-write policies.
- *Accept:* anon can read a public object URL; anon cannot upload; admin can.
- *Files:* `0006_storage.sql`.

**P0-8 ☐ Supabase client + react-query provider** (doc 06.1)
- *Accept:* app boots; a trivial `listCategories()` returns [] (empty dev) without error.
- *Files:* `src/lib/supabase.js`, `src/main.jsx`, `package.json` (+deps).

**P0-9 ☐ Env wiring + `.env.example` + CI** (doc 11)
- `.env.example`; Vercel env vars; CI `npm ci && build` + secret-guard grep.
- *Accept:* build passes in CI; grep guard fails if a service-role key is imported under `src/`.
- *Files:* `.env.example`, `.github/workflows/ci.yml` (or chosen CI), `vercel.json`.

**P0-10 ☐ First-admin bootstrap (dev + prod)** (doc 11.2, 07.8) — *prereq for all Phase 3*
- Create owner auth user in each project; insert into `admins` via SQL; configure password-reset email.
- *Accept:* logging in as the owner makes `is_admin()` true; a non-admin authed user is false; reset email works.
- *Files:* (Supabase dashboard/SQL — document in `supabase/seed/README`).

## Phase 1 — Content from DB

**P1-0 ☐ Generate seed snapshot** (doc 09.1)
- One-off extract `src/data.js` → committed `supabase/seed/content.json` (keys already renamed `t→title,x→body`; `palette_key` resolved; owner/settings/contact included).
- *Accept:* snapshot committed; contains 9 categories + 15 summaries; seed no longer needs `data.js`.
- *Files:* `scripts/extract-seed.mjs`, `supabase/seed/content.json`.

**P1-1 ☐ Seed runner** (doc 09)
- `scripts/seed.mjs`: idempotent upsert of categories, summaries, site_settings from **`supabase/seed/content.json`** (NOT `data.js` — it gets deleted in P1-8); dev-only messages.
- *Accept:* dev shows 9 categories, 15 published summaries; re-run doesn't duplicate; palette keys resolved (fail loud if not); seed runs green even with `src/data.js` absent.
- *Files:* `scripts/seed.mjs`.

**P1-2 ☐ Data-access modules** (doc 06.2)
- `src/api/{categories,summaries,messages,settings,engagement,media}.js` + `hooks.js`.
- *Accept:* each function returns the documented shape against dev data; camelCase mapping; `keyIdeas[].body` present.
- *Files:* `src/api/*`.

**P1-3 ☐ Public reads: home** (doc 08.1)
- Replace `data.js` reads in `home.jsx` with hooks; skeletons; error/empty states.
- *Accept:* home matches current live layout, now from DB; loading skeletons show.
- *Files:* `src/home.jsx`.

**P1-4 ☐ Public reads: browse + search/filter** (doc 08.1, 08.4)
- Server-side sort/filter/search; pagination/infinite scroll; SmartSearch controlled mode preserved.
- *Accept:* category/tag/sort/search all hit the DB; empty-results CTA; header vs browse search modes intact.
- *Files:* `src/browse.jsx`, `src/shell.jsx` (SmartSearch).

**P1-5 ☐ Public reads: detail (+404)** (doc 08.1)
- `getBySlug`; listen tab = key_ideas; read tab = body_paragraphs; 404 view.
- *Accept:* known slug renders; unknown slug → "غير موجود" view; both tabs show real content.
- *Files:* `src/detail.jsx`.

**P1-6 ☐ Public reads: categories/category/about/publisher** (doc 08.1)
- Derived stats; publisher/about from `site_settings`; per-cat counts from DB.
- *Accept:* About & Publisher show **15** (derived), not 16; categories counts correct.
- *Files:* `src/pages.jsx`.

**P1-7 ☐ Error boundary + loading/empty primitives wired** (doc 06.4)
- Top-level boundary; reuse `Empty`/`SkeletonGrid`.
- *Accept:* a forced query error shows retry UI, not a white screen.
- *Files:* `src/App.jsx`, shared components.

**P1-8 ☐ Cutover + retire data.js** (doc 09.5–9.6)
- Verify parity on preview → prod; after soak delete `src/data.js`; CI guard.
- *Accept:* nothing imports `data.js`; site fully DB-driven in prod.
- *Files:* remove `src/data.js`; CI guard.

## Phase 2 — Real audio

**P2-1 ☐ Media upload helpers** (doc 05.2, 06.2 media.js)
- `uploadAudio/uploadCover` with validation + progress; `publicUrl` cache-bust.
- *Accept:* admin can upload a 50 MB mp3 with a progress bar; path returned.
- *Files:* `src/api/media.js`.

**P2-2 ☐ Replace player engine with `<audio>`** (doc 05.5–5.8)
- Remove `setInterval`; single audio element; events→state; actions per contract.
- *Accept:* play/pause/seek/skip/speed all driven by the real element; no simulation code remains.
- *Files:* `src/store.jsx`.

**P2-3 ☐ Duration, resume, progress persistence** (doc 05.9)
- Real `duration`; resume from `localStorage`; throttled save + on pagehide.
- *Accept:* reload resumes within a couple seconds of last position.
- *Files:* `src/store.jsx`, `src/player.jsx`.

**P2-4 ☐ Chapters + RTL scrubber on real timeline** (doc 05.11–5.12)
- Markers from key_ideas over real duration; RTL drag mapping verified.
- *Accept:* dragging the RTL scrubber seeks correctly; chapter taps jump.
- *Files:* `src/player.jsx`.

**P2-5 ☐ "Audio coming soon" + error states** (doc 05.13)
- Null `audio_path` disables play with message; stream errors handled.
- *Accept:* a no-audio summary shows "قيد الإعداد", read tab works; a bad URL shows an error, no crash.
- *Files:* `src/player.jsx`, `src/store.jsx`, `src/detail.jsx`.

## Phase 3 — Real admin

**P3-1 ☐ Auth: login + guard + logout** (doc 04.2, 07.1)
- Supabase password auth; `is_admin()` check; guard all `owner-*`; remove fake login.
- *Accept:* wrong creds rejected; non-admin user blocked; guarded routes redirect when logged out.
- *Files:* `src/auth/*`, `src/owner.jsx`, `src/store.jsx` (route guard).

**P3-2 ☐ Dashboard real counts** (doc 07.2)
- *Accept:* totals/listens/unread/top-5 all from DB; fake trend removed.
- *Files:* `src/owner.jsx`.

**P3-3 ☐ Content list (status/search/delete+media)** (doc 07.3)
- Real statuses; server search; delete confirm → row + media removal.
- *Accept:* drafts visible to admin only; delete removes the storage objects too.
- *Files:* `src/owner.jsx`.

**P3-4 ☐ Editor bound to summaries + the fixes** (doc 07.4) — *depends on P2-1 (upload helpers)*
- Bind all fields; **key-idea body field**; **slug field** (transliterated suggestion, unique, immutable post-publish — ADR-008); **real audio + cover upload**; palette picker; split body into paragraphs; `is_new` derived (no manual toggle — ADR-012).
- *Accept:* create/edit persists every field incl. each idea's body and the slug; uploads set path/duration; generated-cover fallback when no image; editing a published slug warns.
- *Files:* `src/owner.jsx`.

**P3-5 ☐ Save draft / Publish guard / preview** (doc 07.4)
- Draft vs publish; guard (title/author/cat/teaser/≥3 ideas/≥1 para); soft audio warning; preview opens real detail.
- *Accept:* publishing an incomplete summary is blocked with Arabic errors; complete one goes live with no redeploy.
- *Files:* `src/owner.jsx`, `src/api/summaries.js`.

**P3-6 ☐ Messages inbox real** (doc 07.5)
- List/read/archive/delete from `messages`.
- *Accept:* opening marks read; counts update; archive/delete work; empty state shows.
- *Files:* `src/owner.jsx`.

**P3-7 ☐ Settings / publisher profile** (doc 07.6)
- Edit `site_settings`; avatar upload; lock numerals to Latin.
- *Accept:* editing publisher/contact/socials updates the public pages.
- *Files:* `src/owner.jsx`, `src/api/settings.js`.

**P3-8 ☐ Code-split admin out of public bundle** (doc 10.3)
- Dynamic-import `owner-*` views.
- *Accept:* public bundle no longer contains admin code (verify chunk).
- *Files:* `src/App.jsx`.

**P3-9 ☐ Categories management screen** (doc 07.7, ADR-010)
- New `owner-categories`: list w/ counts, create/edit/reorder, delete **blocked while referenced** (offer reassignment first), last-category guard.
- *Accept:* owner can add a category and assign a summary to it; deleting a referenced category is blocked until summaries are reassigned; ordering drives public lists.
- *Files:* `src/owner.jsx`, `src/api/categories.js`.

## Phase 4 — Engagement

**P4-1 ☐ Listen counting wired** (doc 05.10, 08.2)
- `recordListen` once/session past threshold; sessionStorage debounce.
- *Accept:* one play → +1 listen; replays same session don't double-count.
- *Files:* `src/store.jsx`, `src/api/engagement.js`.

**P4-2 ☐ Contact form → messages via verified function** (doc 04.3/08.3, ADR-009)
- The **function** verifies Turnstile + honeypot/rate-limit and **performs the insert with the service role**; client never inserts directly; `messages` has no anon insert policy.
- *Accept:* a submission appears in the admin inbox; bot/honeypot rejected; **a direct anon `insert into messages` from the browser is denied** (deny-test S-spam, doc 14).
- *Files:* `src/pages.jsx` (Contact), `src/api/messages.js`, `api/submit-message.js` (or Supabase Edge Function).

## Phase 5 — Launch readiness

**P5-1 ☐ Dynamic head + per-summary OG** (doc 10.1)
- *Accept:* detail sets per-summary title/description/og:image (cover).
- *Files:* `src/*` (helmet integration), `index.html`.

**P5-2 ☐ Runtime bot-render + runtime sitemap/robots** (doc 10.1, ADR-004)
- Serverless **bot-render** fn serves real HTML/meta to crawlers on demand; **runtime** `sitemap.xml` fn reads the DB per request (NOT build-time — must include summaries published without a redeploy); `robots.txt` references it.
- *Accept:* a summary published with no redeploy appears in `sitemap.xml` and returns real meta to a crawler UA within minutes.
- *Files:* `api/render.js`, `api/sitemap.js`, `public/robots.txt`, `vercel.json`.

**P5-3 ☐ Analytics + Sentry** (doc 10.2)
- *Accept:* a pageview records; a thrown test error reaches Sentry; PII scrubbed.
- *Files:* `src/main.jsx`, env.

**P5-4 ☐ Perf budget + a11y pass** (doc 10.3–10.4)
- *Accept:* Lighthouse Perf ≥85, A11y ≥95 mobile; reduced-motion respected.
- *Files:* various.

**P5-5 ☐ Icons / manifest + CSP headers** (doc 10.6, 10.8)
- *Accept:* installable PWA manifest; favicon set; site-wide default OG image present; CSP headers live.
- *Files:* `public/*`, `index.html`, `vercel.json`.

**P5-6 ☐ Generated per-summary OG image** (doc 10.8, ADR-011)
- Serverless OG-image fn renders a card from `palette_key` + title/author for cover-less summaries; uploaded `cover_path` takes precedence.
- *Accept:* sharing a seeded (cover-less) summary unfurls with a generated card; a summary with an uploaded cover unfurls with that image.
- *Files:* `api/og-image.js`, head-meta wiring.

## Phase 6 — Hardening & launch

**P6-1 ☐ Security review + anon deny-tests in prod** (doc 04, 14)
**P6-2 ☐ Full E2E QA (desktop+mobile, both themes)** (doc 14)
**P6-3 ☐ Privacy + Terms pages; content-licensing sign-off (owner)** (doc 10.7)
**P6-4 ☐ Custom domain + canonical/OG/CORS updates; backups verified** (doc 10.8, 11)
**P6-5 ☐ Launch checklist green → go live** (doc 14 DoD)
