/* ===== shell.jsx — header, nav, footer, search, toasts ===== */
import { useState, useEffect, useRef } from 'react';
import { Icon, Cover } from './utils.jsx';
import { useContent } from './content.jsx';
import { Editable } from './edit.jsx';
import { useApp } from './store.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="تبديل الوضع" title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}>
      <span className="knob"><Icon name={theme === 'light' ? 'sun' : 'moon'} /></span>
    </button>
  );
}

/* SmartSearch supports both controlled mode (value + onChange) and navigation mode */
export function SmartSearch({ big, value: controlledValue, onChange: controlledChange }) {
  const { navigate, recent, setRecent } = useApp();
  const { books: BOOKS, categories: CATEGORIES } = useContent();
  const isControlled = controlledChange !== undefined;
  const [internalQ, setInternalQ] = useState('');
  const q = isControlled ? (controlledValue || '') : internalQ;
  const setQ = isControlled ? controlledChange : setInternalQ;

  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const ql = q.trim().toLowerCase();
  const titleHits = ql ? BOOKS.filter(b => b.title.includes(q) || b.author.includes(q)).slice(0, 4) : [];
  const catHits = ql ? CATEGORIES.filter(c => c.name.includes(q)).slice(0, 3) : [];
  const tagSet = ql ? [...new Set(BOOKS.flatMap(b => b.tags).filter(t => t.includes(q)))].slice(0, 4) : [];
  const popular = ['العادات الذرّية', 'علم النفس', 'الذكاء الاصطناعي', 'يوفال نوح هراري'];

  const submit = (term) => {
    const t = (term ?? q).trim();
    if (!t) return;
    setRecent(r => [t, ...r.filter(x => x !== t)].slice(0, 6));
    setOpen(false);
    if (isControlled) {
      setQ(t);
    } else {
      setInternalQ('');
      navigate('browse', { q: t });
    }
  };

  return (
    <div className={'search-box' + (big ? ' search-big' : '')} ref={ref} style={{ position: 'relative' }}>
      <span className="s-icon"><Icon name="search" /></span>
      <input
        value={q}
        placeholder="ابحث عن كتاب، مؤلّف، أو موضوع…"
        onFocus={() => setOpen(true)}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      {open && (
        <div className="card" style={{ position: 'absolute', top: 'calc(100% + 8px)', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 80, padding: 8, boxShadow: 'var(--shadow-lg)', maxHeight: 420, overflowY: 'auto' }}>
          {!ql && (
            <>
              <div className="sug-h">عمليات البحث الأخيرة</div>
              {recent.map(r => <button key={r} className="sug" onClick={() => submit(r)}><Icon name="clock" size={16} className="faint" /> {r}</button>)}
              <div className="sug-h" style={{ marginTop: 6 }}>الأكثر بحثاً</div>
              {popular.map(p => <button key={p} className="sug" onClick={() => submit(p)}><Icon name="chart" size={16} className="faint" /> {p}</button>)}
            </>
          )}
          {ql && (
            <>
              {titleHits.length > 0 && <div className="sug-h">ملخّصات</div>}
              {titleHits.map(b => (
                <button key={b.id} className="sug" onClick={() => { setOpen(false); if (!isControlled) setInternalQ(''); navigate('detail', { id: b.id }); }}>
                  <span style={{ width: 26, flex: 'none' }}><Cover book={b} /></span>
                  <span style={{ textAlign: 'start' }}><b>{b.title}</b><br /><span className="faint" style={{ fontSize: 12 }}>{b.author}</span></span>
                </button>
              ))}
              {catHits.length > 0 && <div className="sug-h">تصنيفات</div>}
              {catHits.map(c => <button key={c.id} className="sug" onClick={() => { setOpen(false); navigate('category', { id: c.id }); }}><Icon name="layers" size={16} className="faint" /> {c.name}</button>)}
              {tagSet.length > 0 && <div className="sug-h">وسوم</div>}
              {tagSet.map(t => <button key={t} className="sug" onClick={() => submit(t)}><Icon name="tag" size={16} className="faint" /> {t}</button>)}
              {titleHits.length + catHits.length + tagSet.length === 0 && (
                <div className="sug" style={{ color: 'var(--muted)' }}>لا اقتراحات — اضغط Enter للبحث في النصوص</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { route, navigate } = useApp();
  const { content } = useContent();
  const nav = [
    { v: 'home', l: 'الرئيسية' },
    { v: 'browse', l: 'استكشاف' },
    { v: 'categories', l: 'التصنيفات' },
    { v: 'about', l: 'من نحن' },
    { v: 'publisher', l: 'عن الناشر' },
    { v: 'contact', l: 'اتصل بنا' },
  ];
  return (
    <header className="site-header">
      <div className="container">
        <div className="wordmark" onClick={() => navigate('home')}>الموسوعة الذكية<span className="sub desktop-only">{content.brand.tagline}</span></div>
        <nav className="top-nav desktop-only">
          {nav.map(n => <a key={n.v} className={route.view === n.v ? 'active' : ''} onClick={() => navigate(n.v)}>{n.l}</a>)}
        </nav>
        <div className="header-search desktop-only"><SmartSearch /></div>
        <div className="header-tools">
          <button className="icon-btn mobile-only" onClick={() => navigate('browse')} aria-label="بحث"><Icon name="search" /></button>
          <ThemeToggle />
          <button className="btn btn-secondary btn-sm desktop-only" onClick={() => navigate('owner-login')} style={{ marginInlineStart: 6 }}><Icon name="user" size={16} /> الناشر</button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { navigate } = useApp();
  const { content } = useContent();
  return (
    <footer className="site-footer desktop-only">
      <div className="container">
        <div>
          <div className="wordmark">الموسوعة الذكية</div>
          <p style={{ marginTop: 14, maxWidth: '34ch', fontSize: 14.5, lineHeight: 1.9 }}><Editable page="brand" k="footerBlurb" as="span" multiline /></p>
          <div className="social-row">
            <a aria-label="تويتر"><Icon name="twitter" size={18} /></a>
            <a aria-label="لينكدإن"><Icon name="linkedin" size={18} /></a>
            <a aria-label="إنستغرام"><Icon name="instagram" size={18} /></a>
            <a aria-label="يوتيوب"><Icon name="youtube" size={18} /></a>
          </div>
        </div>
        <div>
          <h4>استكشف</h4>
          <a onClick={() => navigate('home')}>الرئيسية</a>
          <a onClick={() => navigate('browse')}>كل الملخّصات</a>
          <a onClick={() => navigate('categories')}>التصنيفات</a>
          <a onClick={() => navigate('library')}>مكتبتي</a>
        </div>
        <div>
          <h4>المنصّة</h4>
          <a onClick={() => navigate('about')}>من نحن</a>
          <a onClick={() => navigate('publisher')}>عن الناشر</a>
          <a onClick={() => navigate('contact')}>اتصل بنا</a>
          <a onClick={() => navigate('owner-login')}>دخول الناشر</a>
        </div>
      </div>
      <div className="container">
        <div className="footer-bottom">
          <span>{content.brand.footerCopyright}</span>
          <span>{content.brand.footerMade}</span>
        </div>
      </div>
    </footer>
  );
}

export function BottomNav() {
  const { route, navigate } = useApp();
  const items = [
    { v: 'home', l: 'الرئيسية', icon: 'home' },
    { v: 'browse', l: 'استكشاف', icon: 'compass' },
    { v: 'library', l: 'مكتبتي', icon: 'library' },
    { v: 'more', l: 'المزيد', icon: 'more' },
  ];
  const active = (v) => route.view === v || (v === 'more' && ['about', 'publisher', 'contact', 'categories'].includes(route.view));
  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button key={it.v} className={active(it.v) ? 'active' : ''} onClick={() => navigate(it.v)}>
          <Icon name={it.icon} /> {it.l}
        </button>
      ))}
    </nav>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className="toast"><Icon name="checkCircle" /> {t.msg}</div>)}
    </div>
  );
}
