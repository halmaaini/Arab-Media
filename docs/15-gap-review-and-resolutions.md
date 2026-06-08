# 15 — Gap Review & Resolutions (review log)

A record of the adversarial review of docs 01–14: tracing each end-to-end
workflow and cross-checking the documents against one another to find logical or
workflow gaps. Each finding lists its resolution and where the specs were
corrected. **The resolutions below are part of the spec** — dev agents must
follow them. A short list of decisions made *on the owner's behalf* during the
review (to confirm or override) is at the end.

## 15.1 Method
Traced five workflows and checked the docs for contradictions:
1. Owner: login → create → upload audio/cover → publish → live.
2. Visitor: discover → listen → resume → favourite.
3. Visitor: contact → owner inbox.
4. Publish → SEO/sharing.
5. Migration: `data.js` → DB → retire `data.js`.

## 15.2 Findings & resolutions

| # | Severity | Gap found | Resolution | Fixed in |
|---|----------|-----------|------------|----------|
| **G1** | **High (security)** | `messages` allowed a **direct anonymous INSERT**, so a bot bypasses Turnstile and writes to the inbox — the captcha was decorative. | Inserts go **only** through a server-side function that verifies the token and inserts with the service role; **no anon insert policy**. | ADR-009; doc 04.3, 08.3, 13/P4-2, 14/S11 |
| **G2** | **High (workflow)** | Headline promise is "publish with no redeploy", but SEO was specified as **build-time** prerender + sitemap → stale for any runtime-published summary. | SEO is **runtime**: serverless bot-render + runtime `sitemap.xml` fn (+ optional deploy hook). | ADR-004; doc 10.1, 08.6, 13/P5-2, 14/A12 |
| **G3** | Med (correctness) | The `summaries_tsv` SQL was a malformed nested expression and **omitted `key_ideas`** from search. | Rewrote the function with valid `string_agg` over `body_paragraphs` **and** key-idea titles. | doc 03.6 |
| **G4** | Med (workflow) | New summaries are authored with **Arabic titles**, but slug generation was hand-waved ("transliterate"). Undefined → broken/duplicate URLs. | Admin-controlled **Latin slug** with a transliterated suggestion, uniqueness check, id-based fallback, **immutable after publish**. | ADR-008; doc 07.4, 13/P3-4 |
| **G5** | Med (workflow) | The data layer had category CRUD but the **admin had no Categories screen**; deleting a referenced category was unhandled. | New `owner-categories` screen; delete **blocked while referenced** (reassign-or-block); last-category guard. | ADR-010; doc 07.7, 13/P3-9, 14/A11 |
| **G6** | Med (gap) | `og:image` used the cover URL, but the 15 seeded summaries have **no real cover image** (CSS-only) → broken unfurls. | Site-wide default OG image **+ a generated OG-image function** (palette+title) for cover-less summaries; uploaded covers win. | ADR-011; doc 10.8, 08.6, 13/P5-6 |
| **G7** | Med (workflow) | The seed runner imported `src/data.js`, but P1-8 **deletes** `data.js` → any reseed breaks. | Seed reads a **committed `supabase/seed/content.json` snapshot**; extract step added. | doc 09.1, 13/P1-0, P1-1 |
| **G8** | Low | `is_new` ambiguous — manual flag or derived? No editor toggle existed. | **Derived** from `published_at` at query time; column kept only as optional override. | ADR-012; doc 03.3, 07.4, 08 |
| **G9** | Low | Favourites/progress key: prototype used `book.id` (= slug); post-migration summaries have uuid + slug → continuity break; stale entries unhandled. | Standardize favourites **and** progress on **`slug`**; Library **silently drops** unpublished/deleted slugs. | doc 08.2, 14/A10 |
| **G10** | Low | First-admin creation and password recovery were unspecified (referenced, not defined). | Bootstrap via dashboard + `admins` SQL insert; Supabase email password reset; documented. | doc 07.8, 11.2, 13/P0-10 |
| **G11** | Minor | Misc: (a) Home Hero when **no** summary is `featured`; (b) `play_events.session_hash` generation. | (a) Hero falls back to newest published when `getFeatured()` is null; (b) `session_hash` = random id in `sessionStorage`, non-identifying, rotates per session. | this doc (binding) |

## 15.3 Result
After these corrections the five workflows trace end-to-end with no missing step,
and the documents are internally consistent (RLS ↔ contact flow, runtime publish
↔ SEO/sitemap, seed ↔ `data.js` retirement, editor fields ↔ data model ↔
acceptance tests). New cross-references were added so a dev following any single
doc is pointed to the governing ADR.

## 15.4 Decisions made on the owner's behalf during this review — **confirm or override**
These were resolved with a sensible default to keep the specs airtight; each has
a cost worth a glance:

1. **Categories are admin-managed** (G5/ADR-010) — adds a small admin screen. If
   you'd rather keep the 9 categories **fixed** (seed-only, simpler), say so and
   P3-9 is dropped.
2. **SEO via serverless bot-render + runtime sitemap** (G2/ADR-004) — adds two
   small serverless functions. Alternative: accept weaker SPA SEO for v1, or
   commit to a Next.js migration (bigger). Recommended as specified.
3. **Generated OG-image function** (G6/ADR-011) — one serverless function so
   shared links of cover-less summaries look good. Alternative: a single static
   default OG image for all (cheaper, less polished).
4. **Contact form routed through a verified function** (G1/ADR-009) — requires a
   Turnstile account + a server secret. This one is **not optional** if you want
   real spam protection; the only alternative is accepting an open inbox.
5. **Latin slugs with transliteration suggestion** (G4/ADR-008) — vs. uuid-based
   URLs (uglier but zero transliteration effort).
6. **`is_new` is derived** (G8/ADR-012) — vs. a manual "new" toggle in the editor.

None of these block starting Phase 0; they affect Phase 3–5 tickets. Flag any
you want changed and the affected docs/tickets will be updated.
