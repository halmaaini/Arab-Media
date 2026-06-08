# 10 — Non-Functional Requirements & Launch Readiness

What separates "it works on my machine" from a public product. Most of these are
Phase 5–6.

## 10.1 SEO (critical for a content site) — ADR-004

The app is a client-rendered SPA: the initial HTML is an empty `#root`, so
crawlers and social unfurlers see no content. For a discovery-driven Arabic
content site this matters. v1 approach (no framework rewrite):

1. **Dynamic head per route** — `react-helmet-async` (or equivalent): set
   `<title>`, `meta description`, canonical, and per-**summary** `og:title`,
   `og:description`, `og:image` (the cover URL), `og:locale=ar_AR`,
   `twitter:card`. (Site-wide defaults already added to `index.html`.)
2. **Prerender public routes at build/deploy** — generate static HTML snapshots
   for the home, browse, categories, about, publisher, and each published
   **summary** route (read slugs from the DB at build time). Options: a
   prerender step in the Vite build, or a Vercel serverless function that
   server-renders meta+content for bot user-agents. Pick one in the Phase 5
   ticket and record it.
3. **`sitemap.xml` + `robots.txt`** — sitemap lists all published summary URLs
   (generated from the DB; refresh on publish or on a schedule). Reference it in
   `robots.txt`.
4. **Structured data** — JSON-LD `Article`/`AudioObject` per summary (optional
   but valuable).
5. **Strategic note:** if organic search becomes a primary channel, the robust
   answer is migrating the **public** app to Next.js (App Router + ISR) for true
   SSR — a **v2** decision requiring a new ADR, not a v1 task.

## 10.2 Analytics & observability
- **Vercel Web Analytics** (privacy-friendly, no cookie banner needed) for
  pageviews/traffic.
- **Custom engagement:** the `listens` counter (doc 05.10); optional
  `play_events` for play-start/completion funnels and "most completed".
- **Error tracking:** `@sentry/react` in the browser — capture unhandled errors
  + the error boundary; scrub PII; sample sensibly. Wire source maps in the
  Vercel build.
- **Logging:** Supabase logs for DB/auth; Vercel logs for the frontend/functions.

## 10.3 Performance budgets
| Metric | Budget |
|--------|--------|
| Lighthouse Performance (mobile) | ≥ 85 |
| LCP | < 2.5 s on 4G |
| Total JS (gzip) | keep < ~120 kB initial; the prototype is ~78 kB gzip — code-split admin out of the public bundle |
| CLS | < 0.1 |
- **Code-split the owner portal** so visitors never download admin code
  (dynamic import the `owner-*` views).
- Lazy-load route chunks; defer Sentry/analytics.
- Audio streams (range requests) — don't preload full files; `preload="metadata"`.
- Images: webp covers, width-appropriate, `loading="lazy"`.

## 10.4 Accessibility (a11y)
- Target **WCAG 2.1 AA**. Lighthouse a11y ≥ 95.
- RTL is already correct; verify focus order under RTL.
- All interactive controls keyboard-operable; visible focus (the `:focus-visible`
  gold outline exists). Player controls have `aria-label`s (some exist — audit all).
- Color contrast AA in both themes; the dark NowPlaying overlay especially.
- Respect `prefers-reduced-motion` for the equalizer/animations.
- Form fields associated `<label>`s; errors announced (`aria-live`).

## 10.5 Internationalization / RTL
- Arabic-only, `dir="rtl"`, **Latin numerals** everywhere (no Eastern-Arabic) —
  a fixed product rule. Keep three-font system (Aref Ruqaa / IBM Plex Sans
  Arabic / Noto Naskh Arabic).
- Dates already formatted in Arabic month names (`fmtDate`). Keep.

## 10.6 Security (cross-ref doc 04)
- RLS verified on all tables; anon deny-tests pass.
- No `service_role` / secrets in client; CI grep guard.
- CSP + security headers via `vercel.json` (connect-src limited to Supabase +
  analytics + Turnstile; frame-ancestors none; etc.).
- `npm audit` clean of high/critical at launch.

## 10.7 Privacy & legal (owner decisions; provide scaffolding)
- **Privacy policy** + **Terms** pages (Arabic). Note what's stored: contact
  messages (name/email/subject/body), anonymous analytics; **no visitor
  accounts/PII beyond messages** (D3). If Turnstile/analytics set anything,
  disclose. Consider UAE **PDPL** alignment (owner is Dubai-based).
- **Content licensing/copyright** — the summaries derive from copyrighted books.
  The owner must ensure summaries are original/transformative or licensed, and
  that cover art doesn't infringe. **Legal, not code** — flagged as a launch
  gate, owner-owned.
- Cookie/consent: Vercel Analytics is cookieless; if any cookie-setting tool is
  added, add a consent mechanism.

## 10.8 Domain & branding
- Connect a **custom domain** in Vercel (owner buys it); set as production
  domain; update canonical/OG URLs and Supabase allowed redirect/CORS origins.
- **Favicon + app icons + `manifest.webmanifest`** (PWA-installable; matches the
  "device-based, no login" intent). Add `og:image` asset (currently meta exists,
  image missing). Maskable icon, theme-color already set per theme.

## 10.9 Reliability
- Supabase automated backups on; documented restore (doc 11).
- Graceful degradation: audio/network errors never crash the SPA; read content
  works even if audio is down.
- Uptime/status: rely on Vercel + Supabase status; optional uptime check on the
  prod URL.
