/* ===== detail.jsx — Summary detail (listen + read) ===== */

function ReadingPanel({ book }) {
  const [size, setSize] = useLocal('readSize', 19);
  const [font, setFont] = useLocal('readFont', 'naskh');
  const [mode, setMode] = useLocal('readMode', 'paper'); // paper | sepia | dark
  const fam = font === 'naskh' ? 'var(--font-read)' : 'var(--font-ui)';
  return (
    <div className={'reader reader-' + mode}>
      <div className="reader-bar">
        <div className="row" style={{ gap: 6 }}>
          <span className="faint" style={{ fontSize: 13, marginInlineEnd: 4 }}>حجم الخط</span>
          <button className="rd-btn" onClick={() => setSize(s => Math.max(15, s - 1))} aria-label="تصغير"><Icon name="minus" size={16} /></button>
          <span className="tnum" style={{ width: 26, textAlign: 'center', fontWeight: 600 }}>{size}</span>
          <button className="rd-btn" onClick={() => setSize(s => Math.min(26, s + 1))} aria-label="تكبير"><Icon name="plus" size={16} /></button>
        </div>
        <div className="seg">
          <button className={font === 'naskh' ? 'on' : ''} onClick={() => setFont('naskh')}>نسخ</button>
          <button className={font === 'sans' ? 'on' : ''} onClick={() => setFont('sans')}>حديث</button>
        </div>
        <div className="seg">
          <button className={mode === 'paper' ? 'on' : ''} onClick={() => setMode('paper')}>ورقي</button>
          <button className={mode === 'sepia' ? 'on' : ''} onClick={() => setMode('sepia')}>بُنّي</button>
          <button className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}>داكن</button>
        </div>
      </div>
      <article className="reader-body" style={{ fontFamily: fam, fontSize: size + 'px' }}>
        <h3 className="reader-lead">{book.teaser}</h3>
        {book.fullText.map((p, i) => <p key={i}>{p}</p>)}
        <div className="reader-ideas">
          <h4>الأفكار الرئيسية</h4>
          <ol>
            {book.keyIdeas.map((k, i) => (
              <li key={i}><strong>{k.t}.</strong> {k.x}</li>
            ))}
          </ol>
        </div>
      </article>
    </div>
  );
}

function Detail() {
  const { route, navigate, playBook, isFav, toggleFav, pushToast, trackId, playing, progress, chapterTime, seek, setNpOpen } = useApp();
  const book = window.bookById(route.params.id) || window.BOOKS[0];
  const [tab, setTab] = useState('listen'); // listen | read
  const readRef = useRef();
  const isThis = trackId === book.id;
  const pos = progress[book.id] || 0;
  const pctRead = Math.min(1, pos / book.dur);
  const related = window.BOOKS.filter(b => b.id !== book.id && (b.cat === book.cat || b.tags.some(t => book.tags.includes(t)))).slice(0, 6);
  const relatedFill = related.length < 4 ? [...related, ...window.BOOKS.filter(b => b.id !== book.id && !related.includes(b)).slice(0, 4 - related.length)] : related;

  const goRead = () => { setTab('read'); setTimeout(() => readRef.current && window.scrollTo({ top: readRef.current.offsetTop - 80, behavior: 'smooth' }), 60); };

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <button className="back-link" onClick={() => navigate(route.params.from || 'browse')}><Icon name="chevR" size={18} /> رجوع</button>

      <div className="detail-top">
        <div className="detail-cover">
          <div className={'cover-wrap' + (book.featured ? ' featured-trim' : '')}><Cover book={book} foot={window.catName(book.cat)} /></div>
        </div>
        <div className="detail-head">
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <span className="cat-chip" onClick={() => navigate('category', { id: book.cat })}>{window.catName(book.cat)}</span>
            {book.isNew && <span className="badge badge-new">جديد</span>}
            {book.featured && <span className="badge badge-feat">مميّز</span>}
          </div>
          <h1 className="detail-title">{book.title}</h1>
          <div className="detail-author">{book.author}</div>
          <p className="detail-teaser">{book.teaser}</p>
          <div className="meta-row" style={{ marginTop: 6 }}>
            <span className="mi"><Icon name="clock" /> {fmtDur(book.dur)}</span>
            <span className="mi"><Icon name="headphones" /> {fmtNumFull(book.listens)} استماع</span>
            <span className="mi"><Icon name="layers" /> {book.keyIdeas.length} أفكار</span>
            <span className="mi">{fmtDate(book.date)}</span>
          </div>

          {pos > 5 && (
            <div className="resume-strip">
              <div className="cl-progress" style={{ flex: 1 }}><i style={{ width: (pctRead * 100) + '%' }}></i></div>
              <span className="faint tnum" style={{ fontSize: 13 }}>وصلت إلى {fmtTime(pos)}</span>
            </div>
          )}

          <div className="detail-actions">
            <button className="btn btn-primary btn-lg" onClick={() => playBook(book.id, { open: true })}>
              <Icon name={isThis && playing ? 'pause' : 'headphones'} size={20} /> {pos > 5 ? 'تابِع الاستماع' : 'استمع'}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={goRead}><Icon name="bookOpen" size={20} /> اقرأ</button>
            <button className={'icon-btn' + (isFav(book.id) ? ' active' : '')} onClick={() => toggleFav(book.id)} aria-label="المفضّلة"><Icon name="heart" fill={isFav(book.id) ? 'currentColor' : 'none'} /></button>
            <button className="icon-btn" onClick={() => pushToast('تم نسخ رابط الملخّص')} aria-label="مشاركة"><Icon name="share" /></button>
          </div>

          <div className="row wrap" style={{ gap: 8, marginTop: 18 }}>
            {book.tags.map(t => <span key={t} className="chip chip-tag" onClick={() => navigate('browse', { q: t })}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="detail-tabs" ref={readRef}>
        <button className={tab === 'listen' ? 'on' : ''} onClick={() => setTab('listen')}><Icon name="headphones" size={18} /> الأفكار والاستماع</button>
        <button className={tab === 'read' ? 'on' : ''} onClick={() => setTab('read')}><Icon name="bookOpen" size={18} /> النص الكامل</button>
      </div>

      {tab === 'listen' ? (
        <div className="ideas-wrap">
          <p className="muted" style={{ marginBottom: 16 }}>كل فكرة رئيسية هي أيضاً فصلٌ على شريط الصوت — اضغط لتُشغّل الصوت من موضعها.</p>
          <div className="stack" style={{ gap: 10 }}>
            {book.keyIdeas.map((k, i) => (
              <div key={i} className="idea-row" onClick={() => { playBook(book.id, { from: chapterTime(book, i), open: true }); }}>
                <div className="idea-num display">{i + 1}</div>
                <div className="grow">
                  <div className="idea-title">{k.t}</div>
                  <div className="idea-text">{k.x}</div>
                </div>
                <div className="idea-jump"><span className="tnum faint">{fmtTime(chapterTime(book, i))}</span><Icon name="play" size={16} /></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ReadingPanel book={book} />
      )}

      <section className="section">
        <SectionHead title="ملخّصات ذات صلة" />
        <Carousel books={relatedFill} />
      </section>
    </div>
  );
}

Object.assign(window, { Detail, ReadingPanel });
