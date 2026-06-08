# الموسوعة الذكية — Production Specification & Build Plan

This folder is the **single source of truth** for turning الموسوعة الذكية from a
front-end prototype (content compiled into `src/data.js`, a mock admin portal, a
simulated player) into a **real, production application** with a working
content workflow: admin authors and publishes → content is stored in a backend →
visitors browse, listen, and reach out → the admin sees the engagement and the
messages.

> **For the dev agents reading this:** Do not improvise architecture. These
> documents are prescriptive. If something is genuinely ambiguous or you find a
> contradiction, stop and raise it rather than guessing. Every ticket in
> `13-task-backlog.md` lists its acceptance criteria; a ticket is not done until
> those pass and the checks in `14-acceptance-and-dod.md` are green.

---

## Locked product decisions

These were decided by the product owner and are **fixed**. Everything in these
specs follows from them. Do not revisit without owner sign-off (see
`02-architecture.md` → ADRs).

| # | Decision | Choice | Consequence |
|---|----------|--------|-------------|
| D1 | Backend | **Supabase** (Postgres + Auth + Storage + auto REST/JS API) | SQL schema, RLS, supabase-js client, no bespoke server |
| D2 | Audio source | **Pre-recorded uploads** (admin uploads MP3/M4A per summary) | Storage `audio` bucket; real `<audio>` player; no TTS |
| D3 | Visitor accounts | **None — device-based** | Favorites/progress stay in `localStorage`; only the admin authenticates; engagement is anonymous |
| D4 | Hosting | **Vercel** (already connected to `halmaaini/Arab-Media`) | Production deploys from `main`; preview from branches |
| D5 | App shape | **Keep Vite + React SPA** | No framework rewrite for v1; SEO handled per `10-nonfunctional-and-launch.md` |

---

## How to read these docs

Read in order for the full picture; jump by topic when implementing a ticket.

| Doc | What it defines | Primary audience |
|-----|-----------------|------------------|
| `01-product-and-scope.md` | Vision, personas, current vs. target state, scope & non-goals, release phases | Everyone |
| `02-architecture.md` | Stack, system & data-flow diagrams, repo layout, ADRs (incl. SEO) | All devs |
| `03-data-model.md` | Full Postgres schema (DDL), enums, indexes, RPCs, jsonb shapes | Backend |
| `04-security-auth-rls.md` | Admin auth, Row-Level-Security per table, storage policies, secrets, threat checklist | Backend / security |
| `05-storage-and-audio.md` | Storage buckets & upload pipeline **and** the audio-player rebuild | Frontend / backend |
| `06-data-access-layer.md` | supabase-js client, per-screen query/mutation **contracts**, states, caching | Frontend |
| `07-admin-portal-spec.md` | Every admin screen & action mapped to a backend operation | Frontend |
| `08-public-app-spec.md` | Every visitor route's data fetch, engagement, contact loop, fallbacks | Frontend |
| `09-migration-and-seed.md` | Move the 15 books + categories + owner + messages from `data.js` → DB | Backend |
| `10-nonfunctional-and-launch.md` | SEO, analytics, performance, a11y, RTL/i18n, security, legal, domain | All / owner |
| `11-environments-and-cicd.md` | Env-var matrix, Supabase & Vercel setup, migrations workflow, branching | DevOps |
| `12-delivery-plan.md` | Phases 0–6 with entry/exit criteria, dependencies, sequencing | Lead / PM |
| `13-task-backlog.md` | Granular, ordered tickets with acceptance criteria & files touched | Dev agents |
| `14-acceptance-and-dod.md` | End-to-end acceptance scenarios, QA checklist, Definition of Done | QA / lead |

---

## Conventions used throughout

- **Language / direction:** UI is Arabic-only, RTL (`dir="rtl"`). Numerals are
  **Latin** (1, 2, 3) everywhere — never Eastern-Arabic. Keep this.
- **Naming:** DB identifiers `snake_case`; JS `camelCase`; React components
  `PascalCase`; CSS classes `kebab-case` (match existing).
- **IDs:** DB primary keys are `uuid` except `categories.id` which stays a
  human slug (`self`, `psych`, …) because the UI and existing data key on it.
  Public URLs use the summary **`slug`** (`atomic-habits`), never the uuid.
- **Status legend in tickets:** ☐ todo · ◐ in progress · ☑ done · ⚠ blocked.
- **"v1" = first production release.** "v2"/"later" = explicitly deferred; see
  `01-product-and-scope.md` → Phasing. Do not build v2 items in v1 tickets.
- **Definition of Done** for any ticket: code + tests + the ticket's acceptance
  criteria + relevant items in `14-acceptance-and-dod.md`, merged to `main`
  (which auto-deploys to Vercel) and verified on the preview/prod URL.

## Glossary

| Term | Meaning |
|------|---------|
| **Summary / خلاصة** | One book summary — the core content unit (was a "book" in `data.js`). DB table `summaries`. |
| **Key idea / فكرة رئيسية** | A titled point within a summary (`{title, body}`). Doubles as an audio "chapter". |
| **Owner / admin** | د. حكمت بعيني — the single authenticated user who manages content. |
| **Visitor** | Anonymous public user. No account. |
| **Device-based state** | Favorites, playback progress, theme, reader prefs — stored in `localStorage`, never server-side. |
| **Generated cover** | The CSS/typographic cover built from a palette + title/author (current behaviour); the fallback when no cover image is uploaded. |
