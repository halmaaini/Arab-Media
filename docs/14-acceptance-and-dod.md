# 14 — Acceptance Tests & Definition of Done

The objective gates. A phase/ticket isn't done until the relevant scenarios here
pass. Run the **anon deny-tests** in every environment before exposing data.

## 14.1 Anon RLS deny-tests (security — run with the anon key)

| # | Attempt (as anonymous) | Expected |
|---|------------------------|----------|
| S1 | `select * from summaries where status='draft'` | 0 rows |
| S2 | `update summaries set listens=999 where …` | denied / 0 rows |
| S3 | `insert into summaries (...)` | denied |
| S4 | `select * from messages` | denied / 0 rows |
| S5 | `insert into messages (valid row)` | allowed (1 row) |
| S6 | `select * from admins` | denied / 0 rows |
| S7 | upload to `audio`/`covers` bucket | denied |
| S8 | read a public object URL | allowed |
| S9 | `rpc increment_listens(published_id)` | listens +1 |
| S10 | `rpc increment_listens(draft_id)` | no change (guarded by status) |
| S11 | direct `insert into messages` with the anon key (bypassing the function) | **denied** — no anon insert policy (ADR-009); confirms the captcha can't be skipped |

## 14.2 End-to-end acceptance scenarios

**A1 — Owner publishes a brand-new summary (the headline outcome)**
1. Log in as admin (valid creds) → dashboard.
2. New summary → fill title/author/category/teaser, add ≥3 key ideas **with
   bodies**, paste full text, pick a palette.
3. Upload an MP3 (progress shows) and a cover image.
4. Publish (guard passes).
5. As an anonymous visitor (separate session) the summary appears in browse/
   home, opens at its slug, **plays audio** with seek/skip/speed/resume, and the
   read tab shows the text — **with no code change or redeploy.**

**A2 — Draft stays private**
- A `draft` summary is invisible to anon (browse/search/direct slug → 404) but
  visible in the admin content list.

**A3 — Audio-less summary degrades gracefully**
- A published summary with no audio shows "الصوت قيد الإعداد", play disabled, read
  tab fully works.

**A4 — Listen counting**
- Playing past the threshold increments `listens` once; replaying in the same
  session does not double-count; dashboard total reflects it.

**A5 — Contact loop**
- Visitor submits the contact form (Turnstile passes) → success state → the
  message appears as `new` in the admin inbox → opening marks it `read` →
  dashboard unread count decrements. Honeypot/bot submission is rejected.

**A6 — Edit & unpublish**
- Editing a published summary updates the public page on next load; unpublish/
  archive removes it from public listings; delete also removes its media.

**A7 — Settings drive public pages**
- Changing publisher bio/contact/socials in admin updates Publisher/About/Contact.

**A8 — Derived stats**
- About & Publisher show the **real count** of published summaries (15 after
  seed), never a hardcoded 16; counts change when content is added/removed.

**A9 — Search & filter**
- Arabic text search returns relevant summaries (title/author/teaser/body);
  tag and category filters and sort (newest/most-listened/title) work on live
  data; empty results show the clear-filters CTA.

**A10 — Resilience**
- A simulated query failure shows a retry card, not a white screen (error
  boundary). A broken audio URL shows an error without crashing playback UI.
- A favorited summary that gets unpublished/deleted is **silently dropped** from
  the Library (no broken card, no throw).

**A11 — Categories management (ADR-010)**
- Owner creates a new category and assigns a summary to it (appears publicly).
- Deleting a category that still has summaries is **blocked** with a prompt to
  reassign; after reassigning, delete succeeds; deleting the last category is
  prevented.

**A12 — Runtime SEO freshness (ADR-004)**
- A summary published **with no redeploy** appears in `sitemap.xml` within
  minutes and returns real `<title>`/meta/OG to a crawler user-agent.
- Sharing a cover-less (seeded) summary unfurls with a **generated** OG card;
  one with an uploaded cover unfurls with that image (ADR-011).

## 14.3 Cross-cutting QA checklist (run desktop + mobile, both themes)

- ☐ Every route: home, browse, detail, library, categories, category, about,
  publisher, contact, more, all `owner-*` — renders from the DB.
- ☐ RTL correct everywhere; **Latin numerals** everywhere; three fonts load.
- ☐ Light ↔ dark toggle works on every page; NowPlaying always dark.
- ☐ Mobile: bottom nav, mini-player dock, filter bottom sheet, NowPlaying overlay.
- ☐ Player: play/pause, ±15 s, speed, sleep timer, RTL scrubber drag, chapter
  jumps, resume after reload — all on real audio.
- ☐ Keyboard navigation + visible focus; reduced-motion honored; AA contrast.
- ☐ No console errors; no unhandled promise rejections.

## 14.4 Launch readiness checklist (Phase 6)

- ☐ All §14.1 deny-tests pass **in production**.
- ☐ All §14.2 scenarios pass in production.
- ☐ Lighthouse mobile: Perf ≥ 85, A11y ≥ 95, Best-Practices ≥ 95, SEO ≥ 90.
- ☐ Shared summary link renders an OG card; `sitemap.xml` + `robots.txt` live.
- ☐ Sentry receives errors; Vercel Analytics records pageviews.
- ☐ No `service_role`/secret in the client bundle (CI guard green); CSP headers live.
- ☐ `npm audit` clean of high/critical.
- ☐ Custom domain live with TLS; canonical/OG/CORS/redirects updated.
- ☐ Supabase backups enabled; restore tested; rollback rehearsed.
- ☐ Privacy + Terms pages published; **owner sign-off on content licensing**.
- ☐ Admin code split out of the public bundle.

## 14.5 Definition of Done (every ticket)
A ticket is **done** when: code implements the referenced spec; its own
acceptance criteria pass; the relevant scenarios/checks above are green; it's
merged to `main` (auto-deploys to Vercel) and verified on the preview/prod URL;
and it introduces no regression in §14.3.

## 14.6 Definition of Launch (the project)
The owner can author a summary with audio in production and a visitor can find,
play, finish, and message about it — and §14.4 is fully green.
