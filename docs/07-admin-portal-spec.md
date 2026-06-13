# 07 — Admin Portal Specification

Maps **every owner screen and action** to a backend operation (doc 06) and the
RLS that authorizes it (doc 04). The prototype's `owner.jsx` has all the UI;
this spec makes it real. **Remove every fake behaviour** (toast-only publish,
accept-anything login, hardcoded counts, inert dropzones).

Routes (existing `view` strings): `owner-login`, `owner` (dash), `owner-content`,
`owner-edit`, `owner-messages`, `owner-settings`.

## 7.1 Login (`owner-login`)
| Element | Behaviour |
|---------|-----------|
| Email + password fields | `supabase.auth.signInWithPassword` |
| Submit | On success → check `is_admin()`; if true navigate `owner`; else sign out + error "حسابك لا يملك صلاحية الإدارة" |
| Failure | Inline error "بيانات الدخول غير صحيحة" — never reveal which field |
| Already authed admin | Skip login, go to dash |
**Replace** the prototype login that navigates on any input. **Guard**: every
`owner-*` route checks session + `is_admin()`; otherwise redirect to login.

## 7.2 Dashboard (`owner`)
All numbers **derived**, never hardcoded.
| Card / widget | Source |
|---------------|--------|
| إجمالي الملخّصات | `count` summaries (admin sees all) or published — label accordingly |
| إجمالي مرّات الاستماع | `sum(listens)` |
| رسائل غير مقروءة | `adminUnreadCount()` |
| الأكثر استماعاً (top 5) | `adminList` order listens desc limit 5 |
> Remove the fake "+12% هذا الشهر" trend unless backed by real data (Phase 5
> analytics can supply it; until then omit or label "—").

## 7.3 Content list (`owner-content`)
| Element | Behaviour |
|---------|-----------|
| Table of summaries | `adminList({status,search})` — admin sees drafts + published + archived |
| Status filter (الكل/منشور/مسودّة) | maps to `status` query; add 'archived' |
| Search box | server-side `ilike`/search on title+author |
| Row: edit | navigate `owner-edit?id` |
| Row: status badge | real `status` (not the prototype's `i % 6` fake) |
| Row: listens | real `listens` |
| Row: delete | confirm modal → `adminDelete` (removes row **and** media) → toast + refetch |
| "إضافة ملخّص" | navigate `owner-edit` (no id) |

## 7.4 Editor (`owner-edit`) — create & edit
Binds the existing form to a `summaries` row. Fixes **two prototype gaps**
(key-idea *body* capture; inert upload dropzones) and adds the **slug** field
(ADR-008); `is_new` becomes derived (ADR-012).

| Field (existing) | Maps to | Notes |
|------------------|---------|-------|
| العنوان | `title` | required |
| المؤلّف | `author` | required |
| التصنيف (select) | `category_id` | from `listCategories()` |
| الوسوم (chips) | `tags[]` | as-is |
| الوصف المختصر | `teaser` | required for publish |
| **الملف الصوتي** (dropzone) | `audio_path` + `audio_duration_seconds` | **FIX:** wire real upload (doc 05.2); show real waveform/filename/duration after upload; progress bar |
| النص الكامل (textarea) | `body_paragraphs[]` | **v1 contract:** split textarea on blank lines → array of paragraphs; the fake RTE toolbar (B/I/H2) is **non-functional today** — either hide it for v1 or implement a real markdown editor (v2). Document choice in the ticket. |
| الأفكار الرئيسية | `key_ideas[{title,body}]` | **FIX:** the prototype captures only the *title*. Add a **body/explanation** field per idea (the `x`). Min 3 ideas to publish. Reorder optional (v2). |
| **صورة الغلاف** (dropzone) | `cover_path` | **FIX:** wire real image upload (doc 05.2); preview; if none, show generated cover from `palette_key` |
| palette (currently implicit) | `palette_key` | add a palette picker (8 options) so the generated-cover fallback is controllable |
| الرابط (slug) | `slug` | **NEW field** (ADR-008): auto-suggested by transliterating the Arabic title → Latin (lowercase, hyphenate, strip punctuation), uniqueness-checked; editable; if left blank, fall back to a short id-based slug; **immutable after first publish** (warn — changing breaks links/SEO) |
| الحالة (مسودّة/منشور) | drives save vs publish | see below |
| ملخّص مميّز (toggle) | `featured` | as-is |
| ("جديد" badge) | `is_new` | **derived** from `published_at` at query time (ADR-012); no manual toggle needed (optional override only) |

**Save / Publish actions (replace the toast-only handler):**
- **حفظ كمسودّة** → `adminCreate`/`adminUpdate` with `status='draft'`.
- **نشر** → run **publish guard** (title, author, category, teaser non-empty;
  ≥3 key ideas each with title+body; ≥1 paragraph). If audio missing, show a
  **soft warning** ("سيُنشر بدون صوت — سيظهر ‹الصوت قيد الإعداد›") but allow.
  Then `adminPublish` (sets `published_at` if first time). On success →
  toast + navigate to content list.
- **معاينة** → open the real public detail in a new view/tab for that summary.
- **Autosave** badge ("حُفظ تلقائياً") is fake today — for v1 either remove it or
  implement debounced draft autosave; default **v1 = explicit save, remove the
  badge** (autosave is v2). Document in the ticket.
- Validation errors surface inline in Arabic; never silently drop data.
- Slug: auto-generate from title on create (transliterate/normalize, ensure
  unique); editable by admin; immutable warning if changing a published slug
  (would break links/SEO) — prefer keeping slug stable post-publish.

## 7.5 Messages inbox (`owner-messages`)
| Element | Behaviour |
|---------|-----------|
| List | `adminListMessages({status})` order newest |
| Unread indicator | rows with `status='new'` highlighted; dashboard count matches |
| Open a message | mark `status='read'` (`adminSetMessageStatus`) |
| Archive / delete | `adminSetMessageStatus(id,'archived')` / `adminDeleteMessage` |
| Empty state | existing `Empty` component |
**Replace** the hardcoded `MESSAGES` array + fake "تمّت المعالجة" with real rows.

## 7.6 Settings / Publisher profile (`owner-settings`)
Backed by `site_settings` (singleton).
| Section | Fields → columns |
|---------|------------------|
| الملف التعريفي (publisher) | name, role, title_line, location, bio[], philosophy, avatar (upload → `avatars`) |
| التواصل | contact_email, contact_phone, contact_location, socials{} |
| الإعدادات الافتراضية | default_speed, default_theme |
| (numerals) | the prototype's "numerals: latin" toggle — **keep Latin fixed**; the app is Latin-only (README convention). Remove the toggle or lock it. |
Save → `adminUpdateSettings`. These values drive the **public** Publisher/About/
Contact pages (doc 08), so editing here updates the live site.

## 7.7 Categories management (`owner-categories`) — NEW (ADR-010, gap review)
The prototype has 9 fixed categories and no way to manage them; a real CMS must
let the owner grow the taxonomy.
| Element | Behaviour |
|---------|-----------|
| List categories | `listCategories()` with summary counts per category |
| Create / edit | `adminUpsertCategory({id,name,blurb,icon,sortOrder})`; `id` is a slug (auto-suggested, editable, unique) |
| Reorder | edit `sort_order` (drag or numeric) — drives public ordering |
| Delete | **blocked while any summary references it** (FK `on delete restrict`). UI must first offer to **reassign** those summaries to another category, then allow delete. Never orphan a summary. |
| Empty/last-category guard | prevent deleting the last category |

## 7.8 Admin-wide requirements
- All admin mutations show optimistic or pending UI + success/error toast.
- All admin reads/writes rely on RLS; the UI guard is convenience, not security.
- Logout in the owner shell → `signOut` → redirect to login.
- No admin action may leave orphaned storage objects (delete cascades media) or
  orphaned summaries (category delete is reassign-or-block).
- **First-admin bootstrap & recovery** (gap review): the owner account is created
  once in the Supabase dashboard and its `auth.users.id` inserted into `admins`
  via SQL (no client path). Password reset uses Supabase's email recovery flow;
  document the steps in `11-environments-and-cicd.md`. There is no self-serve
  admin sign-up.

## 7.9 Page content / copy (CMS) — `owner-pages`
Edits the **marketing/editorial copy** of the public pages (hero eyebrow, section
titles, About editorial, Categories/Browse/Library subtitles, Contact intro,
footer blurb, brand tagline) — NOT layout/structure, so the designed RTL pages
can't be broken. Driven by a keyed dictionary `content[page][key]` with shipped
defaults deep-merged under admin overrides (so new copy keys still appear).
- Prototype: implemented in `src/lib/siteContent.js` (`DEFAULT_CONTENT` +
  `CONTENT_SCHEMA`) and `src/content.jsx` (`content` + `updatePageContent`);
  persists in localStorage; the screen iterates `CONTENT_SCHEMA` to render
  grouped, labeled fields.
- Supabase target: a singleton `site_content` row (one `jsonb` column holding the
  overrides), public-readable, admin-writable — same shape/policies as
  `site_settings` (doc 03/04). Reads merge defaults ⊕ stored, like the prototype.
- Numbers stay derived (About stats); only the labels/copy are editable.
