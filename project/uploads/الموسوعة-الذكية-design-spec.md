# الموسوعة الذكية — Design Specification

> **Hand-off brief for high-fidelity prototyping.**
> An Arabic-only, audio-first platform for book summaries. Public listens & reads to get educated. Think *Blinkist*, but built around a *listenable* summary, fully in Arabic, fully RTL, mobile-first.

---

## 0. How to read this document

- The **product UI is 100% Arabic and RTL.** Every label, button, and string ships in Arabic. English in this doc is for the designer only.
- All Arabic UI copy is given in `«…»` so you can paste it directly.
- Concrete design tokens (color, type, spacing) are provided so the prototype is consistent from the first screen.
- One open decision is flagged in §13 with a recommended default — proceed with the default unless told otherwise.

---

## 1. Product summary

**Name:** الموسوعة الذكية (*"The Smart Encyclopedia"*)
**One-liner (Arabic, for hero):** «استمع للكتاب… أو اقرأه. خلاصة المعرفة بين يديك.»
**Essence:** Every item is a **book summary** delivered as **audio + matching full text**. Visitors browse, search smartly, listen (rich player), or read. No listener login required.

**Three surfaces:**
1. **Public site** — listener/reader experience (the star of the show).
2. **Owner portal** — single owner uploads, writes, and publishes content; sees basic stats.
3. **System settings** — global configuration (branding, categories/tags, featured, defaults, contact info).

**Plus content pages:** من نحن (About Us), عن الناشر (About the Publisher/Owner), اتصل بنا (Contact Us).

**Out of scope:** listener accounts, payments/paywall, comments. Personalization (continue-listening, favorites) is **device-based**, no signup.

---

## 2. Aesthetic direction — "المخطوطة المضيئة" (The Illuminated Manuscript, modernized)

A deliberate, ownable concept: marry the **warmth and gold of classical Arabic manuscripts** (the golden-age-of-knowledge feeling) with the **sleek focus of a modern audio app**. Premium, intellectual, warm — never cold or corporate, never generic.

**Mood words:** scholarly · warm · premium · calm · confident · "makes you *want* to learn."

**Signature moves (the things people remember):**
- A **warm paper-cream reading world** that flips into a **deep emerald-ink "listening world"** in the player — two atmospheres, one brand.
- **Gold as the knowledge accent** — thin illuminated linework, hairline gold rules, gold "now playing" equalizer bars.
- **Cover-forward layouts** — book covers are the primary imagery; cards are built around them with soft depth.
- A faint **geometric Arabic pattern** as texture in headers, empty states, and the player background (very low opacity — atmosphere, not noise).

> Avoid generic AI aesthetics: no Inter/Roboto/system fonts, no purple-on-white gradients, no flat undesigned cards. Commit to ink + gold + paper with characterful Arabic type.

---

## 3. Color tokens

Light is the **default** (reading-friendly). Dark is the **listening/immersive** atmosphere and a full theme option.

```css
:root {
  /* Brand */
  --ink:        #0E2A2E;  /* deep emerald-charcoal — primary brand */
  --ink-700:    #163A3D;
  --ink-500:    #2A5B5C;
  --gold:       #C99A3B;  /* illuminated gold — primary accent */
  --gold-soft:  #E7C77E;  /* highlights, hairlines */
  --jade:       #2E8B6B;  /* secondary accent: progress, success, "new" */
  --coral:      #D9694B;  /* sparingly: live/featured badge */

  /* Light surfaces (reading world) */
  --paper:      #FAF5EC;  /* page background, warm */
  --surface:    #FFFDF8;  /* cards */
  --surface-2:  #F2EADB;  /* sunken / chips */
  --line:       #E3D9C6;  /* hairline borders */
  --text:       #15201F;  /* primary text (ink-black) */
  --text-muted: #5C6B68;
  --text-faint: #92A09C;

  /* Dark surfaces (listening world) */
  --d-bg:       #081D1B;
  --d-surface:  #0F2A27;
  --d-surface-2:#143531;
  --d-line:     #21433E;
  --d-text:     #F2EDE1;
  --d-muted:    #A9BEB7;

  /* Effects */
  --shadow-sm:  0 1px 2px rgba(14,42,46,.06), 0 2px 6px rgba(14,42,46,.05);
  --shadow-md:  0 6px 20px rgba(14,42,46,.10);
  --shadow-lg:  0 18px 48px rgba(14,42,46,.18);
  --radius-card: 18px;
  --radius-btn:  12px;
  --radius-pill: 999px;
}
```

**Usage rules:** ink dominates structure (header, footer, player); gold is the precious accent (never floods — used on active states, key dividers, featured trim, the equalizer); jade carries functional positive states and progress; coral is reserved for one badge type («جديد» / featured). Paper/cream is the canvas everywhere reading happens.

---

## 4. Typography (Arabic — critical)

Three roles, distinctive on purpose:

| Role | Font | Use |
|---|---|---|
| **Display / brand** | **Aref Ruqaa** (calligraphic) | Wordmark, hero title, big section moments — the "manuscript" character. Use sparingly and large. |
| **Headings + UI** | **IBM Plex Sans Arabic** | All headings, buttons, labels, navigation, cards, admin. Modern, authoritative, full weight range. |
| **Long-form reading** | **Noto Naskh Arabic** (selectable) | The summary's full text panel — comfortable sustained Arabic reading. Reader can switch to IBM Plex Sans Arabic and adjust size. |

**Type scale (mobile → desktop, RTL):**
- Display (hero): 30 → 48 px / Aref Ruqaa
- H1: 24 → 32 / Plex Arabic 700
- H2: 20 → 26 / Plex Arabic 700
- H3: 17 → 20 / Plex Arabic 600
- Body: 16 / 16 / Plex Arabic 400, line-height 1.8 (Arabic needs generous leading)
- Reading body: 18–21 (user-scalable) / Noto Naskh, line-height 2.0
- Caption/meta: 13–14 / Plex Arabic 500, --text-muted

**Arabic rules:** generous line-height (≥1.8 body, ≥2.0 reading); never tighten letter-spacing on Arabic; ensure proper Kashida/diacritic rendering; bold via real font weights only.

---

## 5. Layout, grid, spacing, RTL

- **Mobile-first.** Design canvas **390px** first, then scale.
- **Breakpoints:** mobile ≤480 (design 390) · tablet 481–1024 (design 768) · desktop ≥1025 (container max 1200, centered).
- **Grid:** 4-col (mobile) → 8-col (tablet) → 12-col (desktop), 16/24px gutters.
- **Spacing scale (4-based):** 4, 8, 12, 16, 24, 32, 48, 64.
- **Radii:** cards 18 · buttons 12 · images 14 · pills full.
- **RTL everywhere:** layout mirrors; reading flows right→left; all directional icons flip (back chevron points right, progress fills right→left, sliders run right→left, "skip forward 15s" sits on the correct side). Test every screen in true RTL — not a flipped LTR.
- **Tap targets ≥ 44px.** Thumb-reachable primary actions on mobile.

---

## 6. Public site — pages

### 6.1 Home / Library — «الرئيسية»
The front door. Cover-forward and inviting.
- **Header:** wordmark (Aref Ruqaa, gold), search entry, theme toggle. On desktop, slim top nav: الرئيسية · التصنيفات · من نحن · عن الناشر · اتصل بنا.
- **Hero:** featured summary — large cover, title, author, 1-line teaser, big «استمع الآن» (Listen now) + «اقرأ» (Read). Faint manuscript pattern + gold hairline framing the cover.
- **«تابع الاستماع» (Continue listening):** device-based, horizontal scroll of in-progress cards with a thin gold progress ring/bar. Hidden if empty.
- **«تصفّح حسب التصنيف» (Browse by category):** pill chips → category pages.
- **«أحدث الملخصات» (Newest)** and **«الأكثر استماعًا» (Most listened):** horizontal carousels.
- **Full library grid** with a «عرض الكل» link into Browse.
- **Mobile bottom nav** (sticky): الرئيسية · استكشاف (search/browse) · مكتبتي (device library: continue + favorites) · المزيد (about/contact). **Mini-player sits directly above the bottom nav.**

### 6.2 Browse & smart search — «استكشاف»
- **Search bar** (prominent, gold-focus ring). On focus: **smart suggestions** dropdown — matching titles, authors, categories, tags; plus «عمليات البحث الأخيرة» (recent) and «الأكثر بحثًا» (popular). Searches also match **within the summary text/transcript**.
- **Filters:** category (multi), tags (multi), duration buckets — «قصير (< ١٠ د)» / «متوسط (١٠–٢٠ د)» / «طويل (> ٢٠ د)» — and sort: «الأحدث» / «الأكثر استماعًا» / «أبجدي».
  - Desktop: filter rail (right side, RTL) + results.
  - Mobile: «تصفية» button → **bottom sheet** with options + «تطبيق».
- **Results:** count, **active-filter chips** (removable), grid/list toggle, infinite scroll. Thoughtful **empty state** («لم نجد نتائج…») with suggestions and popular picks.

### 6.3 Summary detail — «صفحة الملخص»
The heart of the experience. Two co-equal modes: **listen** and **read.**
- **Top:** cover (with soft depth + gold trim if featured), title, author, category chip, meta row: duration «المدة», listens count, date, tags.
- **Primary actions:** «استمع» (opens/loads player) · «اقرأ» (scrolls to/opens reading panel) · favorite (heart) · share.
- **«الأفكار الرئيسية» (Key ideas):** numbered list. **Each key idea is also a chapter marker** on the audio timeline — tapping jumps the audio there.
- **Reading panel:** the full summary text in Noto Naskh, with reader controls — font size −/+, font switch (Naskh ⇄ Sans), theme (paper / sepia / dark). Comfortable measure, generous leading.
- **Player:** see §7.
- **«ملخصات ذات صلة» (Related):** carousel.
- **Stretch (mark optional):** audio↔text sync — the currently spoken paragraph subtly highlights as audio plays.

### 6.4 Category / Tag page
Header with category name + count, optional short blurb, filtered grid, same filter controls.

### 6.5 من نحن (About Us)
Mission of the platform, what a "summary" is here, who it's for. Editorial layout: a strong Arabic headline (Aref Ruqaa), readable prose, a few stat/value highlights with gold linework. Calm, trustworthy.

### 6.6 عن الناشر (About the Publisher / Owner)
A personal, credibility page about the website owner — portrait, bio, philosophy on knowledge/reading, optional links. Warmer and more human than About Us.

### 6.7 اتصل بنا (Contact Us)
Contact form (الاسم · البريد · الموضوع · الرسالة · «إرسال») + direct contact info and social links pulled from settings. Clear success state («تم إرسال رسالتك، شكرًا لك»). Submissions land in the owner portal (§8.5).

### 6.8 Now Playing (full screen) & مكتبتي
- **Now Playing:** immersive dark "listening world" — see §7.
- **مكتبتي (My Library):** device-based — «تابع الاستماع» + «المفضّلة». Gentle empty states encouraging exploration.

---

## 7. The rich audio player

Two tiers, both fully RTL.

**A) Mini-player (persistent, sticky):** sits above the mobile bottom nav / bottom of viewport on desktop. Shows cover thumb, title, author, play/pause, thin progress bar, expand control. **Audio keeps playing while the user browses other pages.**

**B) Now Playing (expanded, full screen, dark):**
- Large cover, title, author, faint manuscript-pattern backdrop.
- **Scrubber** with elapsed / remaining time; **chapter/key-idea markers** sit on the timeline.
- Big **play/pause**; **skip ±15s**; **previous/next chapter (key idea)**.
- **Speed control:** 0.75× / 1× / 1.25× / 1.5× / 1.75× / 2× (remembers last choice).
- **Sleep timer** «مؤقّت النوم» (15/30/45/60 min / end of summary).
- **Chapters/key-ideas list** — tap to jump.
- **Add to favorites**, **share**, and **«اقرأ النص»** to switch to reading view.
- **Resume position** persists per summary (device).
- **Playing indicator:** animated 3-bar gold equalizer on the active card/header.
- Download: **off by default** (toggle in settings if ever wanted).

---

## 8. Owner portal (single owner)

Private, behind a simple login. Calmer, utilitarian variant of the brand (more surface, less gold flourish), still on-brand and pleasant.

### 8.1 Login — «تسجيل الدخول»
Single-owner login. Branded, minimal.

### 8.2 Dashboard — «لوحة التحكم»
Stat cards: إجمالي الملخصات · إجمالي مرات الاستماع · المنشور مقابل المسودات · رسائل جديدة. Recent activity, top summaries, quick action «إضافة ملخص جديد».

### 8.3 Content library (manage) — «المحتوى»
Table/list of all summaries: cover thumb, title, author, category, status (منشور / مسودة), listens, date. Search, filter by status/category, row actions: تعديل · معاينة · حذف · نشر/إلغاء النشر.

### 8.4 Create / Edit summary — «إضافة / تعديل ملخص»
The most important admin screen. Clear, forgiving form:
- **Audio upload** (drag-drop, progress, waveform preview, auto-detected duration).
- **Cover image** upload (with crop/preview to consistent ratio).
- **Title, Author, Category (select), Tags (multi/free-add).**
- **Short description / teaser.**
- **Full text** (rich-ish Arabic editor, RTL) — this powers the reading panel and transcript search.
- **Key ideas** (repeatable items) — these become chapter markers.
- **Status:** مسودة / نشر · **Featured** toggle · **Preview** (renders the real public detail page) before publishing.
- Autosave + clear validation, all RTL.

### 8.5 Messages — «الرسائل»
Inbox of Contact-form submissions; read/mark-handled.

### 8.6 (Optional) Pages editor
Edit content of من نحن · عن الناشر · اتصل بنا without touching settings.

---

## 9. System settings — «الإعدادات»
Grouped, simple:
- **العلامة التجارية (Branding):** site name, logo, default theme (light/dark), accent.
- **التصنيفات والوسوم (Categories & Tags):** add/edit/remove, reorder.
- **المحتوى المميّز (Featured):** pick hero + featured items.
- **المشغّل (Player defaults):** default speed, allow download (off), sleep-timer presets.
- **التواصل (Contact info):** email, phone, social links (feed Contact + footer).
- **اللغة والأرقام (Locale/numerals):** see §13.
- **SEO أساسي:** title/description per public page.

---

## 10. Component library
Header / desktop nav · mobile bottom nav · **mini-player** · **full player** · **summary card** (variants: hero, grid, list, continue-listening with progress, related) · category pill · tag chip · **smart search bar + suggestions panel** · filter bottom-sheet / rail · active-filter chips · key-idea/chapter list item · reading controls (size/font/theme) · buttons (primary gold-on-ink, secondary outline, ghost) · inputs/select/multiselect (RTL) · **upload dropzone + waveform** · badges («جديد» jade, «مميّز» gold/coral) · toast/snackbar · modal & bottom-sheet · admin stat card · admin data table · tabs · breadcrumbs · pagination/infinite-scroll · **empty states** · **loading skeletons (shimmer)**.

---

## 11. Motion & micro-interactions
High-impact, tasteful, RTL-aware:
- **Page-load on Home:** staggered reveal of hero → carousels (animation-delay).
- **Player expand:** Now-Playing rises as a sheet; cover scales up smoothly.
- **Equalizer:** animated gold bars on the playing item.
- **Cards:** subtle lift/scale on hover (desktop) and press feedback (mobile).
- **Filter sheet:** spring up; chips animate in/out.
- **Scrubber & waveform:** progress animates; light waveform motion while playing.
- **Skeletons:** warm shimmer during loads.
- Respect `prefers-reduced-motion` — drop to fades.

---

## 12. Accessibility & quality bar
- Contrast AA on text (verify gold-on-ink and text-muted).
- Visible focus states; full keyboard nav (admin especially).
- Tap targets ≥44px; player controls comfortably large.
- Transcript/full text is itself an accessibility win — keep it discoverable.
- Semantic structure + correct RTL/`lang="ar"` direction and aria.

---

## 13. Decision to confirm (proceeding with the recommended default)
**Numerals.** Arabic UI can use Western/Latin digits (1, 2, 3) or Eastern Arabic-Indic digits (١، ٢، ٣).
**Recommended default for the prototype:** **Eastern Arabic-Indic numerals (١٢٣)** for durations, counts, dates and player timecodes — most consistent with a fully-Arabic, premium feel — with a **toggle in settings** to switch to Latin. Override anytime.

---

## 14. First screens to prototype (suggested priority)
1. **Home / Library** (mobile + desktop) — sets the whole tone.
2. **Summary detail** with **Now Playing** + reading panel — the core experience.
3. **Browse + smart search/filters** (incl. mobile filter sheet + empty state).
4. **Owner: Create/Edit summary** + **Dashboard**.
5. **About Us / About Publisher / Contact.**
6. **Settings.**

> Deliver in true RTL, mobile-first, with the light "reading world" and dark "listening world" both shown on the player.
