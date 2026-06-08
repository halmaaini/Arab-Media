# 08 — Public (Visitor) App Specification

Every visitor route, its data source, and its engagement behaviour. All reads go
through the data-access layer (doc 06) and see **only `status='published'`**
content (RLS). Device-based state (favorites, progress, theme, reader prefs)
stays in `localStorage` (D3). No visitor auth anywhere.

## 8.1 Routes → data

| Route (`view`) | Fetches | Notes |
|----------------|---------|-------|
| `home` | `getFeatured`, `listNewest(8)`, `listMostListened(8)`, `listCategories`, full grid `listPublished` | Replace `data.js` reads. Keep skeletons (650 ms feel → real loading). |
| `browse` | `listPublished({sort,categoryId,tags,search,limit,offset})` + `search()` | Filters/sort server-side; SmartSearch controlled mode preserved; pagination/infinite scroll (was a static array). |
| `detail` | `getBySlug(slug)`; null → 404 view | Listen tab = `key_ideas`; read tab = `body_paragraphs`. Play via real audio (doc 05). |
| `library` | favorites + progress from `localStorage`; hydrate titles via `getBySlug`/batch fetch | Device-based; unchanged model. |
| `categories` | `listCategories` + `getDerivedStats`/per-cat counts | counts from DB |
| `category` | `listByCategory(id)` | |
| `about` | `getDerivedStats` + `getSiteSettings` | **stat now `count` of published summaries** (kills "16") |
| `publisher` | `getSiteSettings` | replaces `OWNER` object (incl. its hardcoded "16" stat → derived) |
| `contact` | submit → `submitMessage` | see 8.3 |
| `more` | static + `getSiteSettings` links | |

## 8.2 Engagement (anonymous)
- **Listens:** on a qualifying play, `recordListen(summary.id)` once per session
  (doc 05.10). The number shown on cards is the stored `listens`.
- **Favorites:** toggle persists to `localStorage` (`mze_favs`). **Key by `slug`**
  (gap review): in the prototype `book.id` *was* the slug; after migration
  summaries have a uuid `id` + a `slug`, so favorites/progress must standardize
  on **slug** to preserve existing users' saved data and stay human-stable. Audit
  `store.jsx` so `toggleFav`/`isFav`/progress all use slug.
- **Progress / resume:** `localStorage` (`mze_progress`) keyed by **slug**.
- **Stale entries** (gap review): the `library` route hydrates favorites/progress
  by fetching each slug; a slug that is now unpublished/deleted returns null —
  **silently drop it** from the rendered list (and may prune it from localStorage).
  Never render a broken card or throw.
- **Theme & reader prefs:** `localStorage` — unchanged. Default theme/speed may
  seed from `site_settings.default_*` on first visit.

## 8.3 Contact form (`contact`) — make it real (ADR-009)
Replace the toast-only `submit`. **The insert must NOT happen directly from the
browser** (that would bypass the captcha — gap review). Flow:
1. Fields name/email/subject/body (all required — already in UI).
2. Add **Cloudflare Turnstile** widget + hidden **honeypot** field (doc 04).
3. On submit: client validation → `submitMessage({...,token})` calls the
   **`submit-message` Edge/serverless function**, which verifies the Turnstile
   token server-side (`TURNSTILE_SECRET_KEY`), runs honeypot/length/rate-limit
   checks, then inserts the row using the **service role**. `messages` has **no
   anon insert policy**, so a direct browser insert is denied.
4. Success → keep the existing success state ("تم إرسال رسالتك، شكراً لك").
5. Failure → inline Arabic error + allow retry; never lose typed content.
6. The message appears in the admin inbox (doc 07.5) — this is the visitor→owner loop.
- Contact sidebar info (email/phone/location/socials) reads from `site_settings`
  (currently hardcoded in `pages.jsx`).

## 8.4 Search & filter (browse)
- Text query → `search()` (full-text on `search_tsv` + trigram/ILIKE fallback,
  doc 03.6). Tag chips → array-contains filter. Category → eq filter. Sort:
  newest / most-listened / title.
- Preserve SmartSearch **controlled mode** in Browse (the prototype fix) and
  **navigate mode** in the header.
- Empty results → `Empty` component with a "clear filters" CTA.

## 8.5 Loading / error / empty / 404
- Use react-query states everywhere (doc 06.4). Skeletons on first load, inline
  retry on error, `Empty` for no-results, dedicated 404 for unknown slug.
- A top-level **error boundary** prevents a failed query from white-screening.

## 8.6 SEO hooks (detail in doc 10; ADR-004/011)
- Each route sets a dynamic `<title>` + meta description; **detail** sets
  per-summary `og:title/description/image` via a head manager (e.g.
  `react-helmet-async`). `og:image` = uploaded `cover_path` URL if present,
  else the **generated OG-image function** (ADR-011) — never the CSS-only cover.
- `sitemap.xml` is generated at **runtime** (serverless fn reading the DB), not
  build time, so summaries published without a redeploy still appear (ADR-004).
- A serverless **bot-render** function serves real HTML/meta to crawlers &
  social unfurlers on demand (ADR-004) — no stale build-time prerender.

## 8.7 Behaviour parity to preserve (don't regress)
- RTL throughout; Latin numerals; three-font system; light/dark themes; NowPlaying
  always dark. Mini-player dock + bottom nav on mobile. Continue-listening rail.
- The four player niceties: speed, sleep timer, ±15 s skip, chapter markers —
  now driven by real audio (doc 05).
