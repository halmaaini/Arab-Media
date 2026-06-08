# 11 — Environments, Config & CI/CD

## 11.1 Environment variables

| Var | Scope | Secret? | Used by |
|-----|-------|---------|---------|
| `VITE_SUPABASE_URL` | client (Vite) | no | supabase client |
| `VITE_SUPABASE_ANON_KEY` | client (Vite) | no (public by design) | supabase client |
| `VITE_TURNSTILE_SITE_KEY` | client | no | contact form widget |
| `VITE_SENTRY_DSN` | client | no | error tracking |
| `SUPABASE_URL` | seed/CI | no | `scripts/seed.mjs` |
| `SUPABASE_SERVICE_ROLE_KEY` | seed/CI **only** | **YES** | `scripts/seed.mjs` (bypasses RLS) |
| `TURNSTILE_SECRET_KEY` | serverless fn | **YES** | verify contact token |

- Provide a committed **`.env.example`** documenting every var (no values).
- `VITE_`-prefixed vars are embedded in the public bundle — **never** put a
  secret behind that prefix.
- Set client `VITE_*` vars in Vercel Project → Settings → Environment Variables
  (Production + Preview). Set server/seed secrets in Vercel (for functions) and
  in CI secrets (for seed) — never in the repo.

## 11.2 Supabase projects

- **Two projects:** `arab-media-dev` and `arab-media-prod` (separate URLs/keys),
  so seeding/testing never touches prod.
- Use the **Supabase CLI**; commit `supabase/config.toml`.
- Auth settings: **disable public sign-ups** (admin invited manually);
  email+password enabled; allowed redirect URLs = known domains only.
- **First-admin bootstrap** (gap review): in each project, create the owner user
  (Dashboard → Authentication → Add user, or invite email), then add the row
  `insert into admins (user_id) values ('<that auth user id>');` via the SQL
  editor (no client path exists — `admins` has no insert policy). Verify
  `is_admin()` returns true when logged in as that user.
- **Password recovery**: use Supabase's built-in email reset
  (`auth.resetPasswordForEmail`) restricted to the admin's address; configure
  the email template + redirect URL. No self-serve admin signup.
- Storage: create `audio`, `covers` (+ optional `avatars`) buckets with the
  policies in doc 04.4 (as migrations, not hand-clicks, where possible).
- Backups: enable automated backups on prod; document `pg_dump`/restore.

## 11.3 Migrations workflow (schema as code)

- All schema/RLS/functions live in `supabase/migrations/NNNN_*.sql` — the single
  source of truth (doc 03/04). No clicking schema in the dashboard for anything
  that must be reproducible.
- Apply with `supabase db push` (or `supabase migration up`) to dev → verify →
  to prod.
- Order: `0001_extensions_enums` → `0002_tables` → `0003_indexes` →
  `0004_functions_triggers` → `0005_rls_policies` → `0006_storage_buckets_policies`.
- Each migration is forward-only; never edit an applied migration — add a new one.

## 11.4 Vercel

- Project `arab-media` already connected to `halmaaini/Arab-Media`. Framework:
  Vite (auto-detected). `vercel.json` exists (SPA rewrite). Extend it with
  security headers + `sitemap.xml`/`robots.txt` routing (doc 10).
- **Production = `main`.** Preview = any pushed branch / PR.
- Build: `vite build` → `dist`. Node version pinned (project shows 24.x; pin in
  `package.json` `engines` or Vercel settings).
- Serverless functions (if used for Turnstile verify / sitemap / prerender) live
  under `api/` (Vercel functions) — keep server secrets there, not in the bundle.

## 11.5 Branching & deploy rules

- **Develop on feature branches**, e.g. `claude/<topic>`; never commit straight
  to `main` for feature work.
- **Standing rule (owner):** *merge to `main` after each push* — so every pushed
  change lands on `main` and auto-deploys to production. Fast-forward when
  possible; the push to `main` triggers the Vercel production build.
- Verify on the **preview** deployment before the merge when a change is risky
  (esp. the data.js→DB cutover, doc 09).
- Commit messages: clear and descriptive; reference the ticket id from doc 13.

## 11.6 CI checks (add a workflow)

- `npm ci && npm run build` must pass.
- `npm audit` — fail on high/critical at release.
- **Guard:** grep that nothing under `src/` imports a service-role key or (post-
  cutover) `data.js`.
- Lint/format if/when configured (none today — optional to add ESLint/Prettier).
- (Optional) run the seed against an ephemeral dev DB + the anon deny-tests
  (doc 14) as a smoke test.

## 11.7 Local development

```
cp .env.example .env.local           # fill with DEV project values
npm install
npm run dev                          # http://localhost:5173
# schema:
supabase db push                     # apply migrations to dev
node scripts/seed.mjs                # seed dev (service-role from env)
```
- Never point a local dev build at the **prod** Supabase project.
- The owner login for local testing uses a dev admin user (invited in the dev
  project + row in `admins`).
