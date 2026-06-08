# 12 — Delivery Plan (Phases)

Seven phases, sequenced by dependency. Each lists **entry** (can start when) and
**exit** (done when) criteria. Granular tickets are in `13-task-backlog.md`;
acceptance scenarios in `14-acceptance-and-dod.md`. Do not start a phase before
its entry criteria hold; do not call it done before exit criteria pass.

Phases are dependency-ordered, not a time estimate. Phases 0–1 are strictly
sequential; later phases have some parallelism (noted).

```
0 Foundations ─▶ 1 Content from DB ─▶ 2 Real audio ─┐
                                   └▶ 3 Real admin ──┼─▶ 4 Engagement ─▶ 5 Launch readiness ─▶ 6 Hardening & launch
                                                     │
                            (2 and 3 can overlap once 1 is done)
```

---

## Phase 0 — Foundations
**Goal:** Supabase + project plumbing exist and are reproducible.
**Entry:** specs approved; Supabase dev+prod projects created.
**Work:** migrations (extensions/enums/tables/indexes/functions/triggers/RLS/
storage) per docs 03–04; `src/lib/supabase.js`; react-query provider; env wiring
(doc 11); CI build + secret-guard; `.env.example`.
**Exit:**
- Migrations apply cleanly to dev **and** prod; RLS on every table.
- Anon **deny-tests** pass (can't read drafts, can't write, can't read messages).
- App boots with the Supabase client; CI green.

## Phase 1 — Content goes live from the DB
**Goal:** the public site renders entirely from Postgres; `data.js` retired.
**Entry:** Phase 0 exit met.
**Work:** seed runner (doc 09) → load 15 summaries + 9 categories + settings;
build `src/api/*` (doc 06); point **public** pages (home/browse/detail/categories/
about/publisher) at the API; loading/empty/error/404 states; derived stats.
**Exit:**
- Parity: every public route matches the current live site, now DB-driven.
- `getDerivedStats` = {15, 9}; the "16" is gone everywhere (incl. Publisher).
- Preview verified; promoted to prod; after soak, `data.js` deleted + CI guard.

## Phase 2 — Real audio
**Goal:** actual sound; the simulation is gone.
**Entry:** Phase 1 (DB content) done. (Can overlap Phase 3.)
**Work:** storage upload pipeline (doc 05A); replace the `setInterval` engine
with `<audio>` (doc 05B); real duration/resume/scrubber/chapters/speed/sleep;
"audio coming soon" for null `audio_path`; listen-count debounce (RPC).
**Exit:**
- Uploading an MP3 to a summary makes it play end-to-end in the public player
  with working seek, ±15 s, speed, sleep, resume, RTL scrubber.
- Summaries without audio show "قيد الإعداد" and the read tab still works.
- No `setInterval` simulation remains in `store.jsx`.

## Phase 3 — Real admin
**Goal:** the owner manages content for real.
**Entry:** Phase 1 done (and Phase 2 upload pipeline for the audio field).
**Work:** Supabase Auth login + route guard (doc 04/07); dashboard real counts;
content list (real status/search/delete+media); editor bound to `summaries`
incl. the **two fixes** (key-idea body field; real audio/cover upload) + palette
picker + publish guard; messages inbox real; settings/profile → `site_settings`.
**Exit:**
- Owner logs in (fake login removed); creates a new **draft**, uploads audio +
  cover, **publishes**, and it appears publicly — **no redeploy**.
- Edit, unpublish/archive, delete (with media cleanup) all work and are RLS-safe.
- Messages inbox shows real rows; settings edits update the public pages.

## Phase 4 — Engagement loop
**Goal:** the visitor↔owner loop is closed.
**Entry:** Phases 2 & 3 done.
**Work:** wire `recordListen` on qualifying plays (debounced); make the contact
form really insert (Turnstile + honeypot) → admin inbox; derived stats/top-lists
reflect real engagement.
**Exit:**
- Playing a summary increments its `listens` (once/session); dashboard reflects it.
- A submitted contact message appears in the inbox; spam guard active.

## Phase 5 — Launch readiness
**Goal:** discoverable, observable, fast, accessible.
**Entry:** Phase 4 done (can start parts earlier).
**Work:** SEO (dynamic head, prerender, sitemap/robots, JSON-LD); Vercel
Analytics + Sentry; code-split admin out of public bundle; perf budget; a11y
pass; favicon/manifest/OG image; CSP/security headers.
**Exit:**
- Shared summary link renders an OG card; sitemap lists published slugs; crawlers
  get real HTML.
- Lighthouse: Perf ≥ 85, A11y ≥ 95, Best-Practices ≥ 95 (mobile).
- Sentry receives a test error; analytics records a pageview.

## Phase 6 — Hardening & launch
**Goal:** go live on the real domain, safely.
**Entry:** Phase 5 done.
**Work:** full security review (doc 04 checklist) + anon deny-tests in prod;
end-to-end QA (doc 14) on desktop + mobile, both themes; privacy/terms pages;
content-licensing sign-off (owner); custom domain + canonical/OG/CORS updates;
backups verified; rollback rehearsed.
**Exit (Definition of Launch):**
- All `14-acceptance-and-dod.md` scenarios pass in production.
- Custom domain live with TLS; backups on; owner sign-off on content/legal.
- A new summary can be authored, audio-uploaded, and published by the owner, and
  consumed by a visitor, entirely in production.

---

## Cross-phase dependencies (quick reference)
- Everything depends on **Phase 0** schema/RLS.
- Public reads (1) depend on the seed (9) + data-access layer (6).
- Admin audio upload (3) depends on the storage pipeline (2A).
- Engagement (4) depends on the real player (2) and real contact form plumbing.
- SEO/perf (5) is most effective after content is DB-driven (1) and admin is
  code-split (5 work item).
