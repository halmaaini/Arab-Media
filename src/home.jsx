/* ===== home.jsx — Home / Library ===== */
import { useState, useEffect } from 'react';
import { Icon, Cover } from './utils.jsx';
import { useContent } from './content.jsx';
import { useApp } from './store.jsx';
import { Editable } from './edit.jsx';
import { BookCard, SectionHead, Carousel, SkeletonGrid, ContinueCard } from './components.jsx';

function Hero({ book }) {
  const { playBook, navigate } = useApp();
  const { catName, content } = useContent();
  return (
    <div className="hero">
      <div className="hero-grid">
        <div className="cover-wrap"><Cover book={book} foot={content.home.heroFoot} /></div>
        <div className="hero-body">
          <span className="eyebrow"><Icon name="star" size={14} fill="currentColor" style={{ verticalAlign: '-2px', marginInlineEnd: 4 }} /><Editable page="home" k="heroEyebrow" as="span" /></span>
          <h1 className="hero-title">{book.title}</h1>
          <div className="hero-author">{book.author} · {catName(book.cat)}</div>
          <p className="hero-teaser">{book.teaser}</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => playBook(book.id, { open: true })}><Icon name="headphones" size={20} /> استمع الآن</button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('detail', { id: book.id })}><Icon name="bookOpen" size={20} /> اقرأ</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryPills() {
  const { navigate } = useApp();
  const { categories: CATEGORIES, catCount } = useContent();
  return (
    <div className="hscroll"><div className="row" style={{ gap: 10, paddingBottom: 4 }}>
      {CATEGORIES.map(c => (
        <button key={c.id} className="pill" onClick={() => navigate('category', { id: c.id })}>
          {c.name} <span className="faint tnum" style={{ fontWeight: 700 }}>{catCount(c.id)}</span>
        </button>
      ))}
    </div></div>
  );
}

/* ---- home section layout (Phase 3): ordered + show/hide, edited on-page ---- */
const KNOWN = ['continue', 'categories', 'newest', 'most', 'all'];
const LABELS = { continue: 'تابِع الاستماع', categories: 'التصنيفات', newest: 'الأحدث', most: 'الأكثر استماعاً', all: 'المكتبة الكاملة' };

/* Reconcile stored layout with the known sections: keep stored order, drop
 * unknown ids, append any new sections (forward-compatible, never crashes). */
export function resolveLayout(stored) {
  const known = (Array.isArray(stored) ? stored : []).filter((s) => s && KNOWN.includes(s.id));
  const missing = KNOWN.filter((id) => !known.some((s) => s.id === id)).map((id) => ({ id, visible: true }));
  return [...known, ...missing];
}
export function reorder(layout, fromId, toId) {
  if (!fromId || fromId === toId) return layout;
  const arr = layout.slice();
  const from = arr.findIndex((s) => s.id === fromId);
  const to = arr.findIndex((s) => s.id === toId);
  if (from < 0 || to < 0) return layout;
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  return arr;
}
export function moveItem(layout, id, dir) {
  const arr = layout.slice();
  const i = arr.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return layout;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return arr;
}
export function toggleVisible(layout, id) {
  return layout.map((s) => (s.id === id ? { ...s, visible: s.visible === false } : s));
}

function SectionFrame({ id, label, index, total, visible, dragging, over, on, children }) {
  const { editMode } = useContent();
  if (!editMode) return visible ? children : null;
  return (
    <div
      className={'sec-frame' + (visible ? '' : ' is-hidden') + (over ? ' is-over' : '') + (dragging ? ' is-dragging' : '')}
      onDragOver={(e) => { e.preventDefault(); on.dragOver(id); }}
      onDrop={(e) => { e.preventDefault(); on.drop(id); }}
      onDragEnd={() => on.dragEnd()}
    >
      <div className="sec-frame-bar">
        <span
          className="sec-frame-handle"
          draggable
          onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; on.dragStart(id); }}
          title="اسحب لإعادة الترتيب"
        >
          <Icon name="grip" size={16} /> {label}
        </span>
        <span className="sec-frame-tools">
          <button type="button" className="sf-btn" disabled={index === 0} onClick={() => on.move(id, -1)} title="تحريك لأعلى" aria-label="تحريك لأعلى"><Icon name="chevUp" size={16} /></button>
          <button type="button" className="sf-btn" disabled={index === total - 1} onClick={() => on.move(id, 1)} title="تحريك لأسفل" aria-label="تحريك لأسفل"><Icon name="chevDown" size={16} /></button>
          <button type="button" className={'sf-btn' + (visible ? '' : ' off')} onClick={() => on.toggle(id)} title={visible ? 'إخفاء القسم' : 'إظهار القسم'} aria-label={visible ? 'إخفاء القسم' : 'إظهار القسم'}><Icon name={visible ? 'eye' : 'eyeOff'} size={16} /></button>
        </span>
      </div>
      <div className="sec-frame-body">{children || <div className="sec-frame-empty">لا يوجد محتوى لعرضه في هذا القسم حالياً</div>}</div>
    </div>
  );
}

export function Home() {
  const { navigate, progress } = useApp();
  const { books: BOOKS, content, updatePageContent } = useContent();
  const [loading, setLoading] = useState(true);
  const [drag, setDrag] = useState({ id: null, over: null });
  useEffect(() => { const t = setTimeout(() => setLoading(false), 650); return () => clearTimeout(t); }, []);

  const featured = BOOKS.find(b => b.featured) || BOOKS[0];
  const newest = [...BOOKS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const mostListened = [...BOOKS].sort((a, b) => b.listens - a.listens).slice(0, 8);
  const continueBooks = BOOKS.filter(b => (progress[b.id] || 0) > 5 && (progress[b.id] || 0) < b.dur - 5)
    .sort((a, b) => (progress[b.id] || 0) - (progress[a.id] || 0));

  const layout = resolveLayout(content.home.layout);
  const save = (next) => updatePageContent('home', 'layout', next);
  const on = {
    dragStart: (id) => setDrag({ id, over: null }),
    dragOver: (id) => setDrag((d) => (d.over === id ? d : { ...d, over: id })),
    drop: (id) => { save(reorder(layout, drag.id, id)); setDrag({ id: null, over: null }); },
    dragEnd: () => setDrag({ id: null, over: null }),
    move: (id, dir) => save(moveItem(layout, id, dir)),
    toggle: (id) => save(toggleVisible(layout, id)),
  };

  const SECTION = {
    continue: continueBooks.length > 0 ? (
      <section className="section">
        <SectionHead page="home" ckey="secContinue" onMore={() => navigate('library')} moreLabel="مكتبتي" />
        <div className="hscroll"><div className="carousel" style={{ gap: 14 }}>{continueBooks.map(b => <ContinueCard key={b.id} book={b} />)}</div></div>
      </section>
    ) : null,
    categories: (
      <section className="section">
        <SectionHead page="home" ckey="secCategories" onMore={() => navigate('categories')} />
        <CategoryPills />
      </section>
    ),
    newest: (
      <section className="section">
        <SectionHead page="home" ckey="secNewest" onMore={() => navigate('browse', { sort: 'new' })} />
        {loading ? <SkeletonGrid n={5} /> : <Carousel books={newest} />}
      </section>
    ),
    most: (
      <section className="section">
        <SectionHead page="home" ckey="secMost" onMore={() => navigate('browse', { sort: 'listens' })} />
        {loading ? <SkeletonGrid n={5} /> : <Carousel books={mostListened} />}
      </section>
    ),
    all: (
      <section className="section">
        <SectionHead page="home" ckey="secAll" onMore={() => navigate('browse')} />
        {loading ? <SkeletonGrid n={10} /> : (
          <div className="book-grid">{BOOKS.map(b => <BookCard key={b.id} book={b} />)}</div>
        )}
      </section>
    ),
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      {featured && <Hero book={featured} />}
      {layout.map((s, i) => (
        <SectionFrame
          key={s.id}
          id={s.id}
          label={LABELS[s.id]}
          index={i}
          total={layout.length}
          visible={s.visible !== false}
          dragging={drag.id === s.id}
          over={drag.over === s.id}
          on={on}
        >
          {SECTION[s.id]}
        </SectionFrame>
      ))}
    </div>
  );
}
