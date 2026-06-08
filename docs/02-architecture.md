# 02 — Architecture

## 2.1 Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI | **Vite 5 + React 18 (JSX)** | Existing. No router lib — in-memory `{view, params}` routing in `store.jsx`. Keep for v1. |
| Data fetching/cache | **@tanstack/react-query v5** | New. Wrap the supabase-js calls; gives loading/error/cache/refetch for free. |
| Backend | **Supabase** | Managed Postgres + Auth + Storage + auto REST/Realtime + JS client. |
| Auth | **Supabase Auth** (email+password) | Admin only (D3). Session in browser; RLS enforced server-side. |
| DB | **Postgres** (Supabase) | Schema in `03-data-model.md`. RLS on every table. |
| File storage | **Supabase Storage** | Buckets `audio`, `covers` (and optional `avatars`). See doc 05. |
| Audio | **HTML5 `<audio>`** | Streams the uploaded file. Replaces the `setInterval` mock. |
| Hosting / CI | **Vercel** (GitHub integration) | Prod = `main`; previews = branches. |
| Analytics | **Vercel Web Analytics** + custom play events | See doc 10. |
| Errors | **Sentry** (browser SDK) | See doc 10. |

> **Why no custom server?** Supabase exposes an auto-generated, RLS-protected
> API directly to the browser via the **anon** key. The admin authenticates and
> the same policies authorize writes. Privileged one-off jobs (seed) use the
> **service-role** key in a Node script that runs locally/CI **only** — never in
> the client bundle.

## 2.2 System diagram

```
                     ┌───────────────────────────────────────────┐
                     │                 Vercel                     │
                     │   Vite/React SPA (static) + serverless fns  │
                     │   ─ public app   ─ /admin (same bundle)     │
                     └───────────────▲───────────────┬────────────┘
        browser (RTL, ar)            │ static assets │ supabase-js (anon key + auth JWT)
        ┌──────────────┐             │               ▼
        │   Visitor    │─────────────┘     ┌─────────────────────────────┐
        │ (anonymous)  │  read published   │          Supabase           │
        │ localStorage │  insert message   │  Postgres (RLS)  Auth  Storage│
        └──────────────┘  increment listen │  ┌────────┐  ┌────┐  ┌──────┐│
        ┌──────────────┐  auth + CRUD +    │  │summaries│ │users│ │audio │ │
        │  Owner/Admin │  upload media     │  │messages │ └────┘ │covers│ │
        │ (authed)     │──────────────────▶│  │settings │        └──────┘ │
        └──────────────┘                   │  └────────┘                   │
                                           └─────────────────────────────┘
  seed/migration (one-off):  Node script with SERVICE_ROLE key  ──▶ Postgres + Storage
```

## 2.3 Data-flow (the loop that was missing)

1. **Author** — admin opens the editor, fills fields, **uploads audio + cover**
   (files → Storage), saves. Row written to `summaries` (`status='draft'`).
2. **Publish** — admin flips to `published`; DB sets `published_at`; RLS now
   exposes the row to anonymous reads.
3. **Discover** — visitor's home/browse/detail queries fetch only
   `status='published'` rows (RLS) via react-query.
4. **Listen** — `<audio>` streams `audio_path`'s public URL; on a qualifying
   play the client calls `increment_listens` RPC (anonymous, debounced).
5. **Resume** — playback position saved to `localStorage` (device-based, D3).
6. **Reach out** — contact form `insert` into `messages` (anon INSERT policy).
7. **Manage** — admin inbox reads `messages`; marks read/archived (admin RLS).

## 2.4 Repository layout (target)

```
repo/
├── index.html                  # + favicon/manifest/OG (doc 10)
├── vercel.json                 # SPA rewrite (exists) + headers/sitemap (doc 10/11)
├── package.json                # + @supabase/supabase-js, @tanstack/react-query, @sentry/react
├── .env.example                # documents required VITE_* vars (doc 11)
├── docs/                       # ← these specs
├── supabase/
│   ├── migrations/             # SQL migrations (doc 03) — source of truth for schema
│   ├── seed/                   # seed script + extracted data (doc 09)
│   └── config.toml             # supabase CLI config
├── scripts/
│   └── seed.mjs                # Node seed/migration runner (service-role; local/CI only)
└── src/
    ├── lib/
    │   └── supabase.js         # NEW — supabase client (anon)
    ├── api/                    # NEW — data-access layer (doc 06)
    │   ├── summaries.js  categories.js  messages.js  settings.js  engagement.js
    ├── auth/                   # NEW — admin session, route guard (doc 04/07)
    ├── store.jsx               # player engine reworked to <audio> (doc 05); routing kept
    ├── data.js                 # RETIRED after Phase 1 (kept until cutover verified)
    └── (existing components/pages unchanged in structure)
```

## 2.5 Environments

| Env | Supabase project | Vercel | Branch |
|-----|------------------|--------|--------|
| Local dev | `dev` project (or local `supabase start`) | `vite dev` | feature branch |
| Preview | `dev`/`staging` project | Vercel preview | feature branch (PR) |
| Production | `prod` project | Vercel production | `main` |

Two Supabase projects (dev + prod) is the recommended minimum so seed/test data
never touches production. See `11-environments-and-cicd.md`.

## 2.6 Architecture Decision Records (ADRs)

> ADRs capture *why*. Don't reverse one without recording a superseding ADR.

- **ADR-001 — Supabase over custom backend / CMS.** Chosen (D1). Gives DB+Auth+
  Storage+API with minimal code, fits a solo owner, browser-native via RLS.
  Trade-off: logic lives in SQL/RLS; mitigated by keeping policies in
  migrations under version control.
- **ADR-002 — Pre-recorded audio, not TTS.** Chosen (D2). Best quality; owner
  produces narration. Player just streams a file. TTS explicitly out of scope.
- **ADR-003 — No visitor accounts.** Chosen (D3). Favorites/progress stay in
  `localStorage`. Simpler auth surface (admin only), no PII for visitors.
- **ADR-004 — Keep the Vite SPA for v1; do not migrate to Next.js.** Rationale:
  smallest change to ship the workflow. **Consequence:** SEO needs explicit
  handling — dynamic `<head>` meta + a build/serverless **prerender** of public
  routes + `sitemap.xml` (see doc 10). *If organic search becomes a primary
  growth channel, revisit with an ADR proposing a Next.js (App Router + ISR)
  migration of the public app — that is a v2 decision, not a v1 task.*
- **ADR-005 — `key_ideas` and `body_paragraphs` stored as `jsonb` on the
  `summaries` row, not child tables.** Rationale: matches `data.js` shape, atomic
  publish, simplest editor binding. Trade-off: no per-idea FK querying (not
  needed). Revisit only if ideas need independent addressing.
- **ADR-006 — react-query for all reads/mutations.** Standardizes
  loading/error/cache, avoids ad-hoc fetch state in components.
- **ADR-007 — Arabic full-text search uses Postgres `simple` config + `unaccent`
  + trigram fallback.** Postgres ships no Arabic dictionary; `simple` tokenizes
  without stemming, `pg_trgm` covers partial matches. Documented in doc 03.
