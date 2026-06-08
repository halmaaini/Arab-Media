# 05 — Storage, Media & the Audio Player

Two halves: (A) how files are stored and uploaded, and (B) the **player rebuild**
— replacing the `setInterval` simulation in `store.jsx` with a real `<audio>`
element. This is the single most important behavioural change in the project
(D2: the core feature was faked).

---

## Part A — Storage & uploads

### 5.1 Buckets

| Bucket | Visibility | Accepts | Max size | Path convention |
|--------|-----------|---------|----------|-----------------|
| `audio`  | public read | `audio/mpeg` (mp3), `audio/mp4`/`audio/x-m4a` (m4a) | **200 MB** | `audio/{summary_id}.{ext}` |
| `covers` | public read | `image/jpeg`, `image/png`, `image/webp` | **2 MB** | `covers/{summary_id}.{ext}` |
| `avatars` *(optional)* | public read | images | 2 MB | `avatars/owner.{ext}` |

- Write/modify/delete restricted to admin (storage RLS, doc 04).
- Overwrite-on-reupload (`upsert: true`) keyed by `summary_id` so re-uploads
  replace cleanly. Bust caches with a `?v={updated_at}` query param on the
  public URL.
- Store only the **path** in the DB (`audio_path`, `cover_path`). Resolve the
  public URL at read time via `supabase.storage.from(bucket).getPublicUrl(path)`
  (doc 06).

### 5.2 Upload flow (admin editor — see doc 07)

1. Admin selects/drops a file (the editor already has the dropzones — they're
   currently inert; wire them).
2. Client-side validate: MIME type ∈ allowed, size ≤ limit, (cover) reject if
   not roughly 3:4. Show inline error in Arabic on failure.
3. `supabase.storage.from('audio').upload('audio/'+id+'.'+ext, file, { upsert:true, contentType })`
   with an upload **progress** indicator (use the XHR/`onUploadProgress` path or
   tus-resumable for large audio).
4. For **audio**: after upload, read the real duration in the browser
   (`new Audio(objectURL).onloadedmetadata → duration`) and persist
   `audio_duration_seconds`. Set `audio_path`.
5. For **cover**: optionally generate/upload a downscaled webp; set `cover_path`.
6. Save the `summaries` row (path + duration). Saving the file and saving the
   row are **two steps** — handle partial failure (uploaded file but row save
   failed ⇒ allow retry; orphan cleanup job optional).

### 5.3 Image handling

- Display aspect ratio is **3:4** (cover). Recommend storing ~600×800 webp.
- Supabase image transformations may be used for thumbnails
  (`getPublicUrl(path,{transform:{width,height,resize:'cover'}})`) — optional.
- **Fallback:** when `cover_path is null`, render the existing **generated
  cover** (`Cover` component in `utils.jsx`) from `palette_key` + title/author.
  Keep that component; just feed it `palette_key`. This means covers are always
  present, uploaded or not — preserves current look for the 15 seeded summaries.

### 5.4 Audio file guidance (for the owner, not code)

- Format mp3 (broad support) or m4a/AAC; mono or stereo; ~96–128 kbps is plenty
  for narration. Normalize loudness. Keep filenames irrelevant (path is by id).

---

## Part B — The audio player rebuild

### 5.5 What exists today (to be removed)

In `src/store.jsx` the "player engine" is a `setInterval` that increments
`position` by `0.5 * speed` every 500 ms against a hardcoded `track.dur`. There
is **no sound**. `playBook`, `togglePlay`, `seek`, the tick effect, and the
`duration = track.dur` line are all simulation. **Remove the interval engine.**

### 5.6 Target engine — single `<audio>` element

Own one long-lived `HTMLAudioElement` for the app (create via `new Audio()` in
the provider, or a hidden `<audio>` rendered once). The store becomes a thin
React-state mirror of the element's real events.

**State exposed by the store (names kept where possible for minimal churn):**

| State | Source | Replaces |
|-------|--------|----------|
| `trackId` | set by `playBook` | same |
| `track` | summary fetched by id/slug (doc 06) | `bookById` |
| `playing` | `audio` play/pause events | same |
| `position` | `audio.currentTime` via `timeupdate` | simulated `position` |
| `duration` | `audio.duration` via `loadedmetadata` (fallback to `audio_duration_seconds`) | `track.dur` |
| `buffered` | `audio.buffered` (for buffer bar) | — (new) |
| `loading` | `waiting`/`canplay` events | — (new) |
| `error` | `error` event | — (new) |
| `speed` | sets `audio.playbackRate` | same |
| `sleepMin` | unchanged sleep-timer logic | same |

### 5.7 Action contracts

```
playBook(idOrSlug, opts={ open?, from? }):
  - resolve summary; if audio_path is null → set track, mark "audioUnavailable",
    DO NOT attempt to play; UI shows "الصوت قيد الإعداد" and offers the read tab.
  - else: audio.src = publicUrl(audio_path);  audio.load();
          startAt = opts.from ?? savedProgress(slug) (if < duration-5 else 0);
          on 'loadedmetadata' set audio.currentTime = startAt; audio.play();
  - if opts.open → open NowPlaying overlay.
  - guard: calling playBook for the already-loaded track just resumes.

togglePlay():  audio.paused ? audio.play() : audio.pause()
seek(sec):     audio.currentTime = clamp(0, sec, duration)
setSpeed(x):   audio.playbackRate = x   (persist to localStorage 'speed')
skip(±15):     seek(position ± 15)
```

### 5.8 Events → state wiring

| `<audio>` event | Store reaction |
|-----------------|----------------|
| `loadedmetadata` | set `duration`; apply resume `currentTime` |
| `timeupdate` | set `position` (throttle persistence, 5.9) |
| `play` / `pause` | set `playing` |
| `waiting` / `stalled` | `loading = true` |
| `canplay` / `playing` | `loading = false`, clear `error` |
| `ended` | `playing=false`; mark complete; fire listen-count once (5.10) |
| `error` | set `error`; toast "تعذّر تشغيل الصوت"; keep read tab usable |
| `ratechange` | mirror `speed` |

### 5.9 Progress persistence (device-based — D3 unchanged)

- Save `{ [slug]: Math.floor(currentTime) }` to `localStorage` (existing
  `mze_progress`) **throttled** to ~every 5 s and on `pause`/`ended`/`pagehide`.
- Resume reads from `localStorage` only — **no server sync** (D3).
- Keep keying by **slug** (stable, human) rather than uuid for portability.

### 5.10 Listen counting (anonymous engagement)

- Fire `increment_listens(summary.id)` **once per summary per browser session**,
  only after a **meaningful play** threshold (e.g. ≥ 30 s of actual playback or
  10 % of duration, whichever first).
- Track "already counted this session" in memory + `sessionStorage` to debounce.
- Optionally also insert a `play_events` row (Phase 5 / doc 10).

### 5.11 Chapters (key ideas as chapters)

- The NowPlaying scrubber shows chapter markers. Today `chapterAt`/`chapterTime`
  in `store.jsx` divide `dur` into `keyIdeas.length` equal segments. **Keep that
  formula**, now anchored to the **real** `duration`.
- *Optional v2:* per-idea real timestamps — add `seconds` to each `key_ideas`
  element and use them directly. Out of scope for v1.

### 5.12 RTL scrubber (preserve current behaviour)

- The progress bar fills **right → left**; chapter markers position with
  `inset-inline-end`. This already works in the prototype — keep the CSS/logic
  and only swap the data source (real `position`/`duration`). Verify in QA
  (doc 14) that dragging maps pointer-x → time correctly under RTL.

### 5.13 Edge cases to handle

- Audio missing (`audio_path null`) → "coming soon", play disabled, read works.
- Network/streaming error → error state + retry affordance; never crash the SPA.
- Switching tracks mid-play → pause/reset `currentTime`, set new `src`.
- Sleep timer fires → `pause()` (keep existing logic, just call real pause).
- Tab backgrounded → playback continues (normal `<audio>` behaviour); keep
  persisting progress on `pagehide`/`visibilitychange`.
- Speed change mid-play → `playbackRate` applies immediately (no re-load).
