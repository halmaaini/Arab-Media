# 01 — Product Overview & Scope

## 1.1 Vision

الموسوعة الذكية ("The Smart Encyclopedia") is an Arabic platform that turns the
most important books into **audio + readable summaries** ("خلاصات مسموعة
ومقروءة"). A visitor can listen to a ~15–20 minute narrated distillation of a
book or read its full summary text, on any device, with no sign-up. The owner
publishes and manages this content himself.

The current codebase delivers the **experience** convincingly but none of the
**workflow**: content is hardcoded, the player is simulated, and the admin
portal saves nothing. This project builds the missing engine.

## 1.2 Personas

| Persona | Needs | In scope for v1 |
|---------|-------|------------------|
| **Owner / Admin** (د. حكمت) | Log in securely; create/edit a summary; upload its audio + cover; publish or keep as draft; read visitor messages; see basic engagement | ✅ |
| **Visitor** (anonymous) | Browse & search; listen with a real player; read the text; favourite & resume on the same device; send a message | ✅ |
| **Future: registered visitor** | Sync across devices, reviews, history | ❌ (D3 — deferred) |

## 1.3 Current state → Target state

| Capability | Today (prototype) | Target (production) |
|------------|-------------------|----------------------|
| Content storage | Hardcoded `src/data.js` array, shipped at build time | Postgres (Supabase); fetched at runtime |
| Add/edit a summary | Edit code + redeploy | Admin portal writes to DB; live immediately |
| Publish/draft | UI toggle that only fires a toast | Real `status` flag enforced by DB + RLS |
| Audio | `setInterval` faking a progress bar — **no sound** | Real uploaded MP3/M4A streamed via `<audio>` |
| Cover image | CSS-generated only | Uploaded image, with generated cover as fallback |
| Admin auth | Login accepts anything | Supabase Auth; single admin; RLS-guarded |
| "Listens" count | Frozen number in code | Increments on real playback (anonymous) |
| Contact form | Fires a toast, goes nowhere | Inserts into `messages`; appears in admin inbox |
| Messages inbox | Hardcoded sample messages | Real rows; mark read/archive |
| Favourites / progress | `localStorage` | Unchanged — `localStorage` (D3) |
| Publisher / About stats | Hardcoded ("16") | Derived from DB counts |
| SEO | Client-rendered SPA, empty initial HTML | Per-summary meta + sitemap + prerender (see doc 10) |

## 1.4 Scope (v1 — first production release)

**In scope**
1. Supabase backend: schema, RLS, storage buckets, seed of the existing 15 summaries.
2. Public app reads all content from the DB at runtime (no more `data.js`).
3. Real audio player (upload-backed) replacing the simulated engine.
4. Admin: secure login, full summary CRUD, audio + cover upload, publish/draft, delete, messages inbox, publisher/profile & settings.
5. Engagement: anonymous listen counting; working contact form → inbox.
6. Launch hardening: dynamic SEO meta + sitemap, analytics, error tracking, favicon/manifest/OG image, security & a11y pass, custom domain, legal pages.

**Explicit non-goals for v1** (do **not** build these under v1 tickets)
- Visitor accounts / login / cross-device sync (D3).
- Ratings, reviews, comments.
- TTS / auto-generated narration (D2 chose recordings).
- Multi-admin / roles beyond the single owner, granular permissions.
- Payments, subscriptions, paywalls.
- Native mobile apps.
- Multi-language UI (Arabic-only stands).
- A full WYSIWYG rich-text editor (v1 uses structured plain-text/markdown — see doc 07).
- Real-time collaborative editing, autosave-as-you-type (v1 = explicit save; autosave is v2).

## 1.5 Release phasing (summary — full detail in `12-delivery-plan.md`)

| Phase | Theme | Outcome |
|-------|-------|---------|
| **0** | Foundations | Supabase project, schema, RLS, storage, env wiring, client lib, CI |
| **1** | Content goes live from DB | Seed 15 summaries; public app reads DB; `data.js` retired |
| **2** | Real audio | Upload pipeline + `<audio>` player; real durations & resume |
| **3** | Real admin | Auth + CRUD + uploads + publish/draft + delete + messages + settings |
| **4** | Engagement loop | Listen counts; contact form → inbox; derived stats |
| **5** | Launch readiness | SEO, analytics, observability, icons/manifest/OG, perf, a11y |
| **6** | Hardening & launch | Security review, QA pass, custom domain, legal pages, go-live |

## 1.6 Success criteria (what "production-ready" means here)

- The owner can publish a brand-new summary **with audio** end-to-end, from the
  live admin, and a visitor can find, play, and finish it — **without any code
  change or redeploy**.
- A visitor's contact message lands in the owner's inbox.
- Published content is crawlable enough to be indexed; shared links render a card.
- No secret keys in the client bundle; RLS prevents unauthorized writes/reads.
- Lighthouse: Performance ≥ 85, Accessibility ≥ 95, Best-Practices ≥ 95 on mobile.
- The 15 existing summaries remain available throughout the migration.
