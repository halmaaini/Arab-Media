/* ===== browse.jsx — Browse / search / filters ===== */
import { useState, useEffect } from 'react';
import { Icon } from './utils.jsx';
import { useContent } from './content.jsx';
import { useApp } from './store.jsx';
import { BookCard, ListCard, SectionHead, Carousel } from './components.jsx';
import { SmartSearch } from './shell.jsx';

const DURATIONS = [
  { id: 'short', l: 'قصير (< 10 د)', test: s => s < 600 },
  { id: 'mid', l: 'متوسط (10–20 د)', test: s => s >= 600 && s <= 1200 },
  { id: 'long', l: 'طويل (> 20 د)', test: s => s > 1200 },
];
const SORTS = [
  { id: 'new', l: 'الأحدث' },
  { id: 'listens', l: 'الأكثر استماعاً' },
  { id: 'alpha', l: 'أبجدي' },
];

function FilterControls({ cats, setCats, tags, setTags, durs, setDurs, allTags }) {
  const { categories: CATEGORIES } = useContent();
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  return (
    <div className="stack" style={{ gap: 26 }}>
      <div>
        <div className="filter-h">التصنيف</div>
        <div className="row wrap" style={{ gap: 8 }}>
          {CATEGORIES.map(c => <button key={c.id} className={'pill' + (cats.includes(c.id) ? ' active' : '')} onClick={() => toggle(cats, setCats, c.id)}>{c.name}</button>)}
        </div>
      </div>
      <div>
        <div className="filter-h">المدّة</div>
        <div className="row wrap" style={{ gap: 8 }}>
          {DURATIONS.map(d => <button key={d.id} className={'pill' + (durs.includes(d.id) ? ' active' : '')} onClick={() => toggle(durs, setDurs, d.id)}>{d.l}</button>)}
        </div>
      </div>
      <div>
        <div className="filter-h">الوسوم</div>
        <div className="row wrap" style={{ gap: 8 }}>
          {allTags.map(t => <button key={t} className={'chip chip-tag' + (tags.includes(t) ? ' chip-on' : '')} onClick={() => toggle(tags, setTags, t)}>{t}</button>)}
        </div>
      </div>
    </div>
  );
}

export function Browse() {
  const { route, navigate } = useApp();
  const { books: BOOKS, categories: CATEGORIES, content } = useContent();
  const [q, setQ] = useState(route.params.q || '');
  const [cats, setCats] = useState(route.params.cat ? [route.params.cat] : []);
  const [tags, setTags] = useState([]);
  const [durs, setDurs] = useState([]);
  const [sort, setSort] = useState(route.params.sort || 'new');
  const [view, setView] = useState('grid');
  const [sheet, setSheet] = useState(false);
  const allTags = [...new Set(BOOKS.flatMap(b => b.tags))];

  // sync route params when navigating to Browse
  useEffect(() => {
    if (route.params.q !== undefined) setQ(route.params.q || '');
    if (route.params.cat) setCats([route.params.cat]);
    if (route.params.sort) setSort(route.params.sort);
  }, [route.params.q, route.params.cat, route.params.sort]);

  let results = BOOKS.filter(b => {
    if (q) {
      const hit = b.title.includes(q) || b.author.includes(q) || b.tags.some(t => t.includes(q))
        || b.teaser.includes(q) || b.fullText.some(p => p.includes(q)) || b.keyIdeas.some(k => k.t.includes(q));
      if (!hit) return false;
    }
    if (cats.length && !cats.includes(b.cat)) return false;
    if (tags.length && !tags.some(t => b.tags.includes(t))) return false;
    if (durs.length && !durs.some(id => DURATIONS.find(d => d.id === id).test(b.dur))) return false;
    return true;
  });
  results = results.sort((a, b) =>
    sort === 'new' ? b.date.localeCompare(a.date) :
    sort === 'listens' ? b.listens - a.listens :
    a.title.localeCompare(b.title, 'ar')
  );

  const activeFilters = [
    ...cats.map(c => ({ k: 'cat:' + c, l: CATEGORIES.find(x => x.id === c)?.name || c, clear: () => setCats(cats.filter(x => x !== c)) })),
    ...durs.map(d => ({ k: 'dur:' + d, l: DURATIONS.find(x => x.id === d).l, clear: () => setDurs(durs.filter(x => x !== d)) })),
    ...tags.map(t => ({ k: 'tag:' + t, l: '#' + t, clear: () => setTags(tags.filter(x => x !== t)) })),
  ];
  const clearAll = () => { setCats([]); setTags([]); setDurs([]); setQ(''); };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-head">
        <h1 className="page-title">{content.browse.title}</h1>
        <p className="page-sub">{content.browse.subtitle}</p>
      </div>

      {/* Controlled search bar — reflects current q and updates it directly */}
      <div style={{ maxWidth: 620, marginBottom: 22 }}>
        <SmartSearch big value={q} onChange={setQ} />
      </div>

      <div className="browse-layout">
        {/* desktop filter rail */}
        <aside className="filter-rail desktop-only">
          <div className="row-between" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 18 }}>التصفية</h3>
            {activeFilters.length > 0 && <button className="btn-ghost btn-sm" onClick={clearAll} style={{ height: 30 }}>مسح الكل</button>}
          </div>
          <FilterControls {...{ cats, setCats, tags, setTags, durs, setDurs, allTags }} />
        </aside>

        <div className="grow" style={{ minWidth: 0 }}>
          <div className="results-bar">
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-secondary btn-sm mobile-only" onClick={() => setSheet(true)}><Icon name="filter" size={16} /> تصفية {activeFilters.length ? '(' + activeFilters.length + ')' : ''}</button>
              <span className="muted" style={{ fontSize: 14.5, whiteSpace: 'nowrap' }}><b className="tnum" style={{ color: 'var(--fg)' }}>{results.length}</b> ملخّص</span>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <div className="seg desktop-only">
                {SORTS.map(s => <button key={s.id} className={sort === s.id ? 'on' : ''} onClick={() => setSort(s.id)}>{s.l}</button>)}
              </div>
              <select className="select-sm mobile-only" value={sort} onChange={e => setSort(e.target.value)}>
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.l}</option>)}
              </select>
              <div className="seg">
                <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')} aria-label="شبكة"><Icon name="grid" size={18} /></button>
                <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="قائمة"><Icon name="list" size={18} /></button>
              </div>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="row wrap" style={{ gap: 8, marginBottom: 20 }}>
              {activeFilters.map(f => <span key={f.k} className="chip chip-removable">{f.l}<button onClick={f.clear} aria-label="إزالة"><Icon name="x" /></button></span>)}
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty">
              <div className="e-ico"><Icon name="search" /></div>
              <h3>لم نجد نتائج</h3>
              <p>لم نعثر على ملخّصات تطابق بحثك. جرّب كلمات أخرى أو تصفّح المقترحات الرائجة.</p>
              <button className="btn btn-primary" onClick={clearAll}>مسح عوامل التصفية</button>
              <div style={{ marginTop: 36, textAlign: 'start' }}>
                <SectionHead title="اخترنا لك" />
                <Carousel books={[...BOOKS].sort((a, b) => b.listens - a.listens).slice(0, 6)} />
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="book-grid">{results.map(b => <BookCard key={b.id} book={b} />)}</div>
          ) : (
            <div className="stack" style={{ gap: 4 }}>{results.map(b => <ListCard key={b.id} book={b} />)}</div>
          )}
        </div>
      </div>

      {/* mobile filter bottom sheet */}
      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="row-between" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 20 }}>تصفية</h3>
              <button className="icon-btn" onClick={() => setSheet(false)}><Icon name="x" /></button>
            </div>
            <FilterControls {...{ cats, setCats, tags, setTags, durs, setDurs, allTags }} />
            <div className="row" style={{ gap: 12, marginTop: 28 }}>
              <button className="btn btn-secondary grow" onClick={clearAll}>مسح</button>
              <button className="btn btn-primary grow" onClick={() => setSheet(false)}>تطبيق ({results.length})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
