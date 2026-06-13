/* contentStore.js — LOCAL persistence adapter (prototype backend).
 *
 * This is the swap-point for the real backend. Today it persists the whole
 * dataset in localStorage, seeded once from the committed snapshot
 * (supabase/seed/content.json). When Supabase is connected (docs/06), these
 * read/write functions get reimplemented against supabase-js with no change to
 * the components that consume the content context (src/content.jsx).
 *
 * Limitation (by design, prototype): persistence is per-browser/per-device.
 */
import seed from '../../supabase/seed/content.json';

const KEY = 'mze_content_v1';

function seedData() {
  return {
    categories: seed.categories.map((c) => ({ ...c })),
    summaries: seed.summaries.map((s) => ({ ...s })),
    messages: [],                      // sample messages are dev-only; start empty
    settings: { ...seed.site_settings },
    contentOverrides: {},              // editable page copy (CMS); merged over DEFAULT_CONTENT
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to seed */ }
  const data = seedData();
  persist(data);
  return data;
}

export function persist(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota — ignore for prototype */ }
}

/** Reset the local store back to the seed (used by a dev "reset" affordance). */
export function resetData() {
  const data = seedData();
  persist(data);
  return data;
}

export const newId = () => 'loc-' + Math.random().toString(36).slice(2, 10);

/** slug: transliteration-free fallback for the prototype — keep ASCII if the
 *  title is Latin, else derive from an id. (ADR-008 full rule lands with the
 *  real editor.) Ensures uniqueness against existing slugs. */
export function makeSlug(title, existing) {
  const base = (title || '')
    .toLowerCase().trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/[^a-z0-9-]/g, '');           // drop non-ASCII (Arabic) → may be empty
  let slug = base || newId();
  let n = 2;
  const taken = new Set(existing || []);
  while (taken.has(slug)) slug = `${base || 'summary'}-${n++}`;
  return slug;
}
