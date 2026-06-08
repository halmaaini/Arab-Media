/**
 * extract-seed.mjs — Phase 1 / ticket P1-0 (see docs/09 + docs/13).
 *
 * One-off extractor: reads the legacy hardcoded content in src/data.js and emits
 * a committed snapshot at supabase/seed/content.json, already transformed to the
 * production schema (docs/03). The seed runner (scripts/seed.mjs) loads THIS
 * snapshot — never src/data.js, which is deleted in ticket P1-8.
 *
 * Run:  node scripts/extract-seed.mjs
 * No network / no credentials required.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BOOKS, CATEGORIES, OWNER } from '../src/data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../supabase/seed/content.json');

// The 8 design palettes from src/data.js (the `P` map is not exported, so it is
// duplicated here verbatim purely to invert each book's palette object → key).
const PALETTES = {
  ink:   { bg: '#0E2A2E', bg2: '#163A3D', fg: '#E7C77E', accent: '#C99A3B' },
  jade:  { bg: '#13433A', bg2: '#1C5A4B', fg: '#EAD9A6', accent: '#2E8B6B' },
  plum:  { bg: '#2A1C2E', bg2: '#3C2A40', fg: '#E7C77E', accent: '#C99A3B' },
  rust:  { bg: '#3A2018', bg2: '#4E2A1E', fg: '#EBC99A', accent: '#D9694B' },
  navy:  { bg: '#10243A', bg2: '#16314E', fg: '#E7C77E', accent: '#C99A3B' },
  olive: { bg: '#2A2E18', bg2: '#3A3E22', fg: '#E7C77E', accent: '#C99A3B' },
  wine:  { bg: '#34161C', bg2: '#481E26', fg: '#E7C77E', accent: '#C99A3B' },
  teal:  { bg: '#08302E', bg2: '#0F423E', fg: '#E7C77E', accent: '#2E8B6B' },
};
const PALETTE_BY_JSON = new Map(
  Object.entries(PALETTES).map(([k, v]) => [JSON.stringify(v), k])
);
function paletteKey(p) {
  const key = PALETTE_BY_JSON.get(JSON.stringify(p));
  if (!key) throw new Error('Unmatched palette (fail loud per docs/09.2): ' + JSON.stringify(p));
  return key;
}

// Contact constants currently hardcoded in src/pages.jsx (Contact aside).
const CONTACT = {
  email: 'hello@smart-encyclopedia.ar',
  phone: '+971 56 522 3700',
  location: 'دبي، الإمارات العربية المتحدة',
};

const categories = CATEGORIES.map((c, i) => ({
  id: c.id, name: c.name, blurb: c.blurb ?? null, icon: null, sort_order: i,
}));

const summaries = BOOKS.map((b) => ({
  slug: b.id,
  title: b.title,
  author: b.author,
  category_id: b.cat,
  tags: b.tags ?? [],
  teaser: b.teaser ?? null,
  key_ideas: (b.keyIdeas ?? []).map((k) => ({ title: k.t, body: k.x })),
  body_paragraphs: b.fullText ?? [],
  palette_key: paletteKey(b.palette),
  cover_path: null,
  audio_path: null,
  audio_duration_seconds: b.dur ?? null, // provisional; real value set on audio upload
  listens: b.listens ?? 0,
  featured: !!b.featured,
  is_new: !!b.isNew,
  status: 'published',
  published_at: b.date ?? null,
}));

const site_settings = {
  id: 1,
  publisher_name: OWNER.name ?? null,
  publisher_role: OWNER.role ?? null,
  publisher_title_line: OWNER.titleLine ?? null,
  publisher_location: OWNER.location ?? null,
  publisher_bio: OWNER.bio ?? [],
  publisher_philosophy: OWNER.philosophy ?? null,
  publisher_avatar_path: null,
  socials: { twitter: '', linkedin: '', instagram: '', youtube: '' },
  contact_email: CONTACT.email,
  contact_phone: CONTACT.phone,
  contact_location: CONTACT.location,
  default_speed: 1,
  default_theme: 'light',
};

const snapshot = {
  _meta: {
    generatedFrom: 'src/data.js',
    note: 'Committed seed snapshot. Consumed by scripts/seed.mjs. OWNER.stats intentionally dropped (now derived). Sample MESSAGES are NOT seeded into prod.',
  },
  categories,
  summaries,
  site_settings,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');

// --- verification output (docs/09.4) ---
const ideasOk = summaries.every((s) => s.key_ideas.every((k) => k.title && k.body));
console.log('wrote', OUT);
console.log('categories:', categories.length, '(expected 9)');
console.log('summaries :', summaries.length, '(expected 15)');
console.log('all published:', summaries.every((s) => s.status === 'published'));
console.log('every key_idea has title+body:', ideasOk);
console.log('palette keys used:', [...new Set(summaries.map((s) => s.palette_key))].sort().join(', '));
