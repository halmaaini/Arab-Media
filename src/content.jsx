/* content.jsx — app-wide content context (prototype backend).
 *
 * Holds the whole dataset in state (seeded from localStorage via contentStore),
 * and exposes:
 *   - component-facing books in the EXISTING shape (toBook) so public pages and
 *     the player need minimal changes;
 *   - admin mutations that actually persist (create/edit/publish/delete, etc.).
 *
 * Swap point: when Supabase is connected, reimplement the mutations + initial
 * load against supabase-js (docs/06); the consumer API below stays the same.
 */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { loadData, persist, newId, makeSlug } from './lib/contentStore.js';
import { paletteOf } from './lib/palettes.js';
import { DEFAULT_CONTENT } from './lib/siteContent.js';

const Ctx = createContext(null);
export const useContent = () => useContext(Ctx);

/* canonical summary (store shape) -> component shape (the old data.js `book`) */
function toBook(s) {
  return {
    id: s.slug,
    slug: s.slug,
    title: s.title,
    author: s.author,
    cat: s.category_id,
    tags: s.tags || [],
    teaser: s.teaser || '',
    keyIdeas: (s.key_ideas || []).map((k) => ({ t: k.title, x: k.body })),
    fullText: s.body_paragraphs || [],
    palette: paletteOf(s.palette_key),
    palette_key: s.palette_key,
    dur: s.audio_duration_seconds || 0,
    audioPath: s.audio_path || null,
    coverPath: s.cover_path || null,
    listens: s.listens || 0,
    date: s.published_at,
    featured: !!s.featured,
    isNew: !!s.is_new,
    status: s.status,
  };
}

export function ContentProvider({ children }) {
  const [data, setData] = useState(() => loadData());

  const commit = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persist(next);
      return next;
    });
  }, []);

  // ---- derived (public sees published only; owner sees all) ----
  const categories = useMemo(
    () => [...data.categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [data.categories]
  );
  const publishedSummaries = useMemo(
    () => data.summaries.filter((s) => s.status === 'published'),
    [data.summaries]
  );
  const books = useMemo(() => publishedSummaries.map(toBook), [publishedSummaries]);
  const allBooks = useMemo(() => data.summaries.map(toBook), [data.summaries]);

  const bookById = useCallback(
    (slug) => {
      const s = data.summaries.find((x) => x.slug === slug);
      return s ? toBook(s) : null;
    },
    [data.summaries]
  );
  const booksByCat = useCallback((catId) => books.filter((b) => b.cat === catId), [books]);
  const catById = useCallback((id) => categories.find((c) => c.id === id) || null, [categories]);
  const catName = useCallback((id) => (catById(id) || {}).name || '', [catById]);
  const catCount = useCallback((id) => books.filter((b) => b.cat === id).length, [books]);

  const messages = useMemo(
    () => [...data.messages].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [data.messages]
  );
  const unreadCount = useMemo(() => messages.filter((m) => m.status === 'new').length, [messages]);

  const derivedStats = useMemo(
    () => ({ summaries: publishedSummaries.length, categories: categories.length }),
    [publishedSummaries.length, categories.length]
  );

  // ---- admin mutations (persist) ----
  const createSummary = useCallback((f) => {
    const slug = makeSlug(f.slug || f.title, data.summaries.map((s) => s.slug));
    const now = new Date().toISOString();
    const row = {
      slug,
      title: f.title || '',
      author: f.author || '',
      category_id: f.category_id || categories[0]?.id || 'self',
      tags: f.tags || [],
      teaser: f.teaser || '',
      key_ideas: f.key_ideas || [],
      body_paragraphs: f.body_paragraphs || [],
      palette_key: f.palette_key || 'ink',
      cover_path: f.cover_path || null,
      audio_path: f.audio_path || null,
      audio_duration_seconds: f.audio_duration_seconds || null,
      listens: 0,
      featured: !!f.featured,
      is_new: true,
      status: f.status || 'draft',
      published_at: f.status === 'published' ? now : null,
    };
    commit((d) => ({ ...d, summaries: [row, ...d.summaries] }));
    return slug;
  }, [commit, data.summaries, categories]);

  const updateSummary = useCallback((slug, patch) => {
    commit((d) => ({
      ...d,
      summaries: d.summaries.map((s) => {
        if (s.slug !== slug) return s;
        const next = { ...s, ...patch };
        if (next.status === 'published' && !next.published_at) next.published_at = new Date().toISOString();
        return next;
      }),
    }));
  }, [commit]);

  const setStatus = useCallback((slug, status) => updateSummary(slug, { status }), [updateSummary]);
  const setFeatured = useCallback((slug, val) => updateSummary(slug, { featured: !!val }), [updateSummary]);
  const deleteSummary = useCallback((slug) => {
    commit((d) => ({ ...d, summaries: d.summaries.filter((s) => s.slug !== slug) }));
  }, [commit]);

  const incrementListens = useCallback((slug) => {
    commit((d) => ({
      ...d,
      summaries: d.summaries.map((s) => (s.slug === slug ? { ...s, listens: (s.listens || 0) + 1 } : s)),
    }));
  }, [commit]);

  // ---- categories (admin) ----
  const upsertCategory = useCallback((cat) => {
    commit((d) => {
      const exists = d.categories.some((c) => c.id === cat.id);
      const categoriesNext = exists
        ? d.categories.map((c) => (c.id === cat.id ? { ...c, ...cat } : c))
        : [...d.categories, { sort_order: d.categories.length, ...cat }];
      return { ...d, categories: categoriesNext };
    });
  }, [commit]);
  const deleteCategory = useCallback((id) => {
    // ADR-010: block while referenced
    const referenced = data.summaries.some((s) => s.category_id === id);
    if (referenced) return { ok: false, reason: 'referenced' };
    if (data.categories.length <= 1) return { ok: false, reason: 'last' };
    commit((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
    return { ok: true };
  }, [commit, data.summaries, data.categories]);

  // ---- messages (contact loop) ----
  const submitMessage = useCallback(({ name, email, subject, body }) => {
    const row = { id: newId(), name, email, subject, body, status: 'new', created_at: new Date().toISOString() };
    commit((d) => ({ ...d, messages: [row, ...d.messages] }));
    return { ok: true };
  }, [commit]);
  const setMessageStatus = useCallback((id, status) => {
    commit((d) => ({ ...d, messages: d.messages.map((m) => (m.id === id ? { ...m, status } : m)) }));
  }, [commit]);
  const deleteMessage = useCallback((id) => {
    commit((d) => ({ ...d, messages: d.messages.filter((m) => m.id !== id) }));
  }, [commit]);

  // ---- settings (publisher/contact/defaults) ----
  const settings = data.settings;
  const updateSettings = useCallback((patch) => {
    commit((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, [commit]);

  // ---- editable page copy (CMS): DEFAULT_CONTENT ⊕ stored overrides ----
  const content = useMemo(() => {
    const ov = data.contentOverrides || {};
    const merged = {};
    for (const page of Object.keys(DEFAULT_CONTENT)) merged[page] = { ...DEFAULT_CONTENT[page], ...(ov[page] || {}) };
    return merged;
  }, [data.contentOverrides]);
  const updatePageContent = useCallback((page, key, val) => {
    commit((d) => {
      const ov = d.contentOverrides || {};
      return { ...d, contentOverrides: { ...ov, [page]: { ...(ov[page] || {}), [key]: val } } };
    });
  }, [commit]);

  const value = {
    // public/shared reads
    books, allBooks, bookById, booksByCat, categories, catById, catName, catCount,
    messages, unreadCount, settings, derivedStats, content,
    // admin mutations
    createSummary, updateSummary, setStatus, setFeatured, deleteSummary, incrementListens,
    upsertCategory, deleteCategory,
    submitMessage, setMessageStatus, deleteMessage, updateSettings, updatePageContent,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
