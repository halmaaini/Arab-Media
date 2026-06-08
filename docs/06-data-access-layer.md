# 06 — Data-Access Layer (supabase-js + react-query)

Defines the **contract** every screen uses to read/write data. Components never
call supabase-js directly — they call functions in `src/api/*` wrapped by
react-query hooks. This keeps loading/error/cache handling uniform and makes the
public→DB cutover (doc 09) a one-file change per entity.

## 6.1 Client setup

`src/lib/supabase.js`
```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
```

`src/main.jsx` — wrap the app in a react-query provider:
```js
const queryClient = new QueryClient({ defaultOptions: { queries: {
  staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } } });
```

Env vars (doc 11): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## 6.2 Module map & function contracts

> Types below are descriptive (the project is JSX). Returned objects are mapped
> to **camelCase** at this layer so components keep their current prop shapes
> where practical. `keyIdeas` items expose `{ title, body }`.

### `src/api/categories.js`
| Function | Query | Returns |
|----------|-------|---------|
| `listCategories()` | `categories` order by `sort_order` | `[{id,name,blurb,icon,sortOrder}]` |
| `getCategory(id)` | `categories` eq id | one or null |
| `adminUpsertCategory(c)` *(admin)* | upsert | row |

### `src/api/summaries.js`
| Function | Query (RLS auto-filters to published for anon) | Returns |
|----------|------------------------------------------------|---------|
| `listPublished({sort,categoryId,tags,search,limit,offset})` | `summaries` filtered + ordered; `sort ∈ {new, listens, title}` | `{rows, count}` |
| `getBySlug(slug)` | `summaries` eq slug (public sees only published) | summary or null (→ 404) |
| `getFeatured()` | `summaries` eq featured, status published, limit 1 | summary or null |
| `listNewest(n=8)` | order `published_at desc` | rows |
| `listMostListened(n=8)` | order `listens desc` | rows |
| `listByCategory(categoryId)` | eq category, published | rows |
| `search(q,filters)` | `websearch_to_tsquery('simple',unaccent(q))` on `search_tsv` + tag/category filters + trigram fallback | `{rows,count}` |
| `adminList({status,search})` *(admin)* | all statuses (admin RLS) | rows |
| `adminGet(id)` *(admin)* | by id | row |
| `adminCreate(input)` *(admin)* | insert (status default draft) | row |
| `adminUpdate(id,patch)` *(admin)* | update | row |
| `adminPublish(id)` *(admin)* | update status='published', set `published_at` if null (after passing publish guard, doc 07) | row |
| `adminUnpublish(id)` / `adminArchive(id)` *(admin)* | update status | row |
| `adminDelete(id)` *(admin)* | delete row **and** remove its `audio`/`covers` objects | void |

### `src/api/messages.js`
| Function | Query | Returns |
|----------|-------|---------|
| `submitMessage({name,email,subject,body,token})` | verify Turnstile `token` (doc 04) → insert | `{ok}` |
| `adminListMessages({status})` *(admin)* | select order created desc | rows |
| `adminSetMessageStatus(id,status)` *(admin)* | update | row |
| `adminDeleteMessage(id)` *(admin)* | delete | void |
| `adminUnreadCount()` *(admin)* | `count` where status='new' | number |

### `src/api/settings.js`
| Function | Query | Returns |
|----------|-------|---------|
| `getSiteSettings()` | select singleton | settings object |
| `getDerivedStats()` | `count` published summaries + categories | `{summaries, categories}` (kills the "16" drift) |
| `adminUpdateSettings(patch)` *(admin)* | update id=1 | row |

### `src/api/engagement.js`
| Function | Query | Returns |
|----------|-------|---------|
| `recordListen(summaryId)` | rpc `increment_listens` (debounced, doc 05.10) | void |
| `recordPlayEvent(...)` *(optional)* | insert play_events | void |

### `src/api/media.js`
| Function | Action |
|----------|--------|
| `publicUrl(bucket, path)` | `storage.from(bucket).getPublicUrl(path)` + `?v=updatedAt` cache-bust |
| `uploadAudio(summaryId, file, onProgress)` *(admin)* | upload upsert; return path |
| `uploadCover(summaryId, file)` *(admin)* | upload upsert; return path |

## 6.3 react-query hook conventions

- Query keys: `['summaries','published',filters]`, `['summary',slug]`,
  `['categories']`, `['messages',status]`, `['settings']`, `['stats']`,
  `['admin','summaries',filters]`.
- Mutations invalidate the relevant keys on success
  (e.g. `adminPublish` → invalidate `['admin','summaries']`,
  `['summaries','published']`, `['summary',slug]`, `['stats']`).
- Provide `useXxx` hooks in `src/api/hooks.js` so components import hooks, not raw fns.

## 6.4 Loading / error / empty states (mandatory per screen)

The prototype already has the visual primitives — reuse them:
- **Loading:** `SkeletonGrid` (lists), skeleton blocks (detail). Never a blank flash.
- **Empty:** existing `Empty` component (icon + title + text + CTA).
- **Error:** inline retry card (Arabic copy) + toast; never an unhandled throw.
  Add a top-level React **error boundary** so a query failure can't white-screen
  the SPA.
- **404:** `getBySlug` null → a proper "الملخّص غير موجود" view with a CTA home.

## 6.5 Caching & freshness

- Reads cached by react-query (`staleTime` 60 s). Admin mutations invalidate
  immediately so the admin sees fresh data; public pages pick up changes on next
  refetch/visit.
- Detail pages may use a longer `staleTime`; `listMostListened` shorter (counts
  move). Tune per ticket, document in code.

## 6.6 Cutover discipline (doc 09)

- Phase 1 introduces these modules and points the **public** pages at them
  behind no flag needed (read-only). Keep `data.js` importable until parity is
  verified, then delete it (doc 09 cutover). After deletion, a CI grep ensures
  nothing imports `data.js`.
