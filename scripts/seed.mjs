/**
 * seed.mjs — Phase 1 / ticket P1-1 (see docs/09, docs/13).
 *
 * Idempotent load of supabase/seed/content.json into Supabase. Uses the
 * SERVICE-ROLE key (bypasses RLS) — run locally or in CI ONLY, never in the
 * browser. Loads the committed snapshot, NOT src/data.js (which is deleted in
 * ticket P1-8).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
 *
 * Prerequisite: migrations 0001–0006 already applied (supabase/README.md).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing env: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service-role, never a VITE_ var).');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const snap = JSON.parse(readFileSync(resolve(here, '../supabase/seed/content.json'), 'utf8'));
const db = createClient(URL, KEY, { auth: { persistSession: false } });

async function upsert(table, rows, onConflict) {
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
}

try {
  // Order respects FKs: categories → site_settings → summaries.
  await upsert('categories', snap.categories, 'id');
  await upsert('site_settings', [snap.site_settings], 'id');
  await upsert('summaries', snap.summaries, 'slug'); // publish CHECK already satisfied (docs/09.4)
  // NOTE: sample MESSAGES are intentionally NOT seeded (dev/staging only; never prod) — docs/09.1.

  const counts = {};
  for (const t of ['categories', 'summaries']) {
    const { count, error } = await db.from(t).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`${t} count: ${error.message}`);
    counts[t] = count;
  }
  console.log('seed complete:', counts, '(expected { categories: 9, summaries: 15 })');
} catch (e) {
  console.error('seed FAILED:', e.message);
  process.exit(1);
}
