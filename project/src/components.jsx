/* ===== components.jsx — shared cards & bits ===== */

function BookCard({ book, showBadge = true }) {
  const { navigate, trackId, playing } = useApp();
  const isPlaying = trackId === book.id && playing;
  return (
    <div className="book-card reveal" onClick={() => navigate('detail', { id: book.id })}>
      <div className="cover-wrap" style={{ position: 'relative' }}>
        <Cover book={book} />
        {showBadge && book.isNew && <span className="badge badge-new" style={{ position: 'absolute', top: 8, insetInlineStart: 8 }}>جديد</span>}
        {showBadge && book.featured && <span className="badge badge-feat" style={{ position: 'absolute', top: 8, insetInlineStart: 8 }}>مميّز</span>}
        {isPlaying && <span style={{ position: 'absolute', bottom: 8, insetInlineEnd: 8, background: 'rgba(14,42,46,.82)', borderRadius: 8, padding: '5px 7px' }}><Equalizer /></span>}
      </div>
      <div className="book-meta">
        <div className="bt">{book.title}</div>
        <div className="ba">{book.author}</div>
        <div className="brow">
          <span className="row" style={{ gap: 4 }}><Icon name="clock" size={14} /> {fmtDur(book.dur)}</span>
          <span className="dot"></span>
          <span>{fmtNum(book.listens)} استماع</span>
        </div>
      </div>
    </div>
  );
}

function ListCard({ book, index }) {
  const { navigate } = useApp();
  return (
    <div className="list-card" onClick={() => navigate('detail', { id: book.id })}>
      {index != null && <div className="display gold" style={{ fontSize: 22, width: 28, textAlign: 'center', flex: 'none' }}>{index}</div>}
      <Cover book={book} />
      <div className="lc-body">
        <div className="lc-title">{book.title}</div>
        <div className="lc-sub">{book.author} · {window.catName(book.cat)}</div>
        <div className="meta-row" style={{ marginTop: 6, fontSize: 13 }}>
          <span className="mi"><Icon name="clock" size={14} /> {fmtDur(book.dur)}</span>
          <span className="mi"><Icon name="headphones" size={14} /> {fmtNum(book.listens)}</span>
        </div>
      </div>
      <Icon name="chevL" size={20} className="faint" />
    </div>
  );
}

function ContinueCard({ book }) {
  const { navigate, progress, playBook } = useApp();
  const pos = progress[book.id] || 0;
  const pct = Math.min(1, pos / book.dur);
  return (
    <div className="cl-card card" onClick={() => navigate('detail', { id: book.id })}>
      <div className="cl-inner">
        <div className="cover-wrap" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); playBook(book.id, { open: true }); }}>
          <Cover book={book} />
          <Ring pct={pct} />
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="play" size={18} /></span>
        </div>
        <div className="cl-body">
          <div className="clt">{book.title}</div>
          <div className="cla">{book.author}</div>
          <div className="cl-progress"><i style={{ width: (pct * 100) + '%' }}></i></div>
          <div className="cl-time">تبقّى {fmtDur(book.dur - pos)}</div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, onMore, moreLabel = 'عرض الكل' }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {onMore && <span className="more" onClick={onMore}>{moreLabel} <Icon name="chevL" size={16} /></span>}
    </div>
  );
}

function Carousel({ books }) {
  return (
    <div className="hscroll"><div className="carousel">{books.map(b => <BookCard key={b.id} book={b} />)}</div></div>
  );
}

function SkeletonGrid({ n = 5 }) {
  return (
    <div className="book-grid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}>
          <div className="skel" style={{ aspectRatio: '3/4.4', borderRadius: 14 }}></div>
          <div className="skel" style={{ height: 14, marginTop: 12, width: '90%' }}></div>
          <div className="skel" style={{ height: 11, marginTop: 8, width: '55%' }}></div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { BookCard, ListCard, ContinueCard, SectionHead, Carousel, SkeletonGrid });
