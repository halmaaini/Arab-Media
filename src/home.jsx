/* ===== home.jsx — Home / Library ===== */
import { useState, useEffect } from 'react';
import { Icon, Cover } from './utils.jsx';
import { useContent } from './content.jsx';
import { useApp } from './store.jsx';
import { BookCard, SectionHead, Carousel, SkeletonGrid, ContinueCard } from './components.jsx';

function Hero({ book }) {
  const { playBook, navigate } = useApp();
  const { catName, content } = useContent();
  return (
    <div className="hero">
      <div className="hero-grid">
        <div className="cover-wrap"><Cover book={book} foot={content.home.heroFoot} /></div>
        <div className="hero-body">
          <span className="eyebrow"><Icon name="star" size={14} fill="currentColor" style={{ verticalAlign: '-2px', marginInlineEnd: 4 }} />{content.home.heroEyebrow}</span>
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

export function Home() {
  const { navigate, progress } = useApp();
  const { books: BOOKS, content } = useContent();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 650); return () => clearTimeout(t); }, []);
  const featured = BOOKS.find(b => b.featured) || BOOKS[0];
  const newest = [...BOOKS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const mostListened = [...BOOKS].sort((a, b) => b.listens - a.listens).slice(0, 8);
  const continueBooks = BOOKS.filter(b => (progress[b.id] || 0) > 5 && (progress[b.id] || 0) < b.dur - 5)
    .sort((a, b) => (progress[b.id] || 0) - (progress[a.id] || 0));

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      {featured && <Hero book={featured} />}

      {continueBooks.length > 0 && (
        <section className="section">
          <SectionHead title={content.home.secContinue} onMore={() => navigate('library')} moreLabel="مكتبتي" />
          <div className="hscroll"><div className="carousel" style={{ gap: 14 }}>{continueBooks.map(b => <ContinueCard key={b.id} book={b} />)}</div></div>
        </section>
      )}

      <section className="section">
        <SectionHead title={content.home.secCategories} onMore={() => navigate('categories')} />
        <CategoryPills />
      </section>

      <section className="section">
        <SectionHead title={content.home.secNewest} onMore={() => navigate('browse', { sort: 'new' })} />
        {loading ? <SkeletonGrid n={5} /> : <Carousel books={newest} />}
      </section>

      <section className="section">
        <SectionHead title={content.home.secMost} onMore={() => navigate('browse', { sort: 'listens' })} />
        {loading ? <SkeletonGrid n={5} /> : <Carousel books={mostListened} />}
      </section>

      <section className="section">
        <SectionHead title={content.home.secAll} onMore={() => navigate('browse')} />
        {loading ? <SkeletonGrid n={10} /> : (
          <div className="book-grid">{BOOKS.map(b => <BookCard key={b.id} book={b} />)}</div>
        )}
      </section>
    </div>
  );
}
