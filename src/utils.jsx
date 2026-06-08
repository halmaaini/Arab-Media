/* ===== utils.jsx — icons, cover, formatters, hooks ===== */
import { useState, useCallback } from 'react';

/* ---- Latin-digit formatters ---- */
export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
export function fmtDur(sec) {
  const m = Math.round((sec || 0) / 60);
  return m + ' دقيقة';
}
export function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return String(n);
}
export function fmtNumFull(n) { return new Intl.NumberFormat('en-US').format(n); }
export function fmtDate(iso) {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const d = new Date(iso);
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

/* ---- localStorage hook (device-based state) ---- */
export function useLocal(key, initial) {
  const [v, setV] = useState(() => {
    try { const raw = localStorage.getItem('mze_' + key); return raw != null ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  const set = useCallback((nv) => {
    setV(prev => {
      const val = typeof nv === 'function' ? nv(prev) : nv;
      try { localStorage.setItem('mze_' + key, JSON.stringify(val)); } catch {}
      return val;
    });
  }, [key]);
  return [v, set];
}

/* ---- Icons (inline SVG) ---- */
const PATHS = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  play: 'M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5Z',
  pause: 'M8 5h3v14H8zM13 5h3v14h-3z',
  heart: 'M12 20s-7.5-4.6-10-9.2C.5 7.7 2.3 4.5 5.6 4.5c2 0 3.3 1.2 4.4 2.6 1.1-1.4 2.4-2.6 4.4-2.6 3.3 0 5.1 3.2 3.6 6.3C19.5 15.4 12 20 12 20Z',
  share: 'M16 6l-4-4-4 4M12 2v13M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM16 8l-2.2 5.8L8 16l2.2-5.8L16 8Z',
  library: 'M4 5a1 1 0 0 1 1-1h3v16H5a1 1 0 0 1-1-1V5ZM10 4h3v16h-3zM15.4 4.3l2.9.8a1 1 0 0 1 .7 1.2l-3.5 13',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  chevR: 'M15 6l-6 6 6 6',
  chevL: 'M9 6l6 6-6 6',
  chevDown: 'M6 9l6 6 6-6',
  x: 'M6 6l12 12M18 6 6 18',
  filter: 'M3 5h18M6 12h12M10 19h4',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 7v5l3 2',
  headphones: 'M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 1 2 2v3a2 2 0 0 1-4 0v-3a2 2 0 0 1 2-2ZM20 13a2 2 0 0 0-2 2v3a2 2 0 0 0 4 0v-3a2 2 0 0 0-2-2Z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  book: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2V4.5ZM6 17h13',
  bookOpen: 'M12 6.5C10.5 5 8 4.5 4 4.8V18c4-.3 6.5.2 8 1.7M12 6.5C13.5 5 16 4.5 20 4.8V18c-4-.3-6.5.2-8 1.7M12 6.5V19.7',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13H2.8a2 2 0 0 1 0-4H3a1.6 1.6 0 0 0 1.5-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 3.2V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 22 11h.2a2 2 0 0 1 0 4H22a1.6 1.6 0 0 0-1.6 1Z',
  skip15F: 'M12 4V2L8 5l4 3V6a6 6 0 1 1-6 6',
  skip15B: 'M12 4V2l4 3-4 3V6a6 6 0 1 0 6 6',
  next: 'M5 5l9 7-9 7zM17 5v14',
  prev: 'M19 5l-9 7 9 7zM7 5v14',
  timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 14V10M9 2h6',
  speed: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 12l4-3M12 4v2',
  check: 'M5 12.5 10 17l9-10',
  checkCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM8 12l3 3 5-6',
  mail: 'M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11ZM3.5 7l8.5 6 8.5-6',
  phone: 'M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L17 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  pin: 'M12 22s7-6.2 7-12A7 7 0 0 0 5 10c0 5.8 7 12 7 12ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4 21a8 8 0 0 1 16 0',
  lock: 'M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM12 15v2',
  upload: 'M12 16V4m0 0L8 8m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  inbox: 'M3 13h5l1.5 3h5L21 13M3 13l3-8h12l3 8M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',
  star: 'M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 17l-5.3 3 1.2-6L3.4 9.8l6-.7L12 3.5Z',
  tag: 'M3 11.5V4a1 1 0 0 1 1-1h7.5a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8l-7 7a2 2 0 0 1-2.8 0l-7.5-7.5A2 2 0 0 1 3 11.5ZM7.5 8h.01',
  arrowL: 'M19 12H5m0 0l6-6m-6 6l6 6',
  text: 'M4 6h16M4 12h16M4 18h10',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5',
  sparkle: 'M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3L12 3Z',
  twitter: 'M22 4.5c-.7.5-1.5.8-2.4 1a4 4 0 0 0-7 2.7v.9A9.5 9.5 0 0 1 5 5.8s-4 9 5 13a10 10 0 0 1-6 2c9 5 20 0 20-11.5 0-.3 0-.6-.1-.8.9-.8 1.6-1.9 2.1-3Z',
  linkedin: 'M6 9v10M6 5.5v.01M11 19v-5.5a2.5 2.5 0 0 1 5 0V19M11 19v-9',
  instagram: 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 7h.01',
  youtube: 'M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 15.5v-7ZM10 9.5v5l4.5-2.5L10 9.5Z',
  layers: 'M12 3l9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  type: 'M4 7V5h16v2M9 19h6M12 5v14',
};

export function Icon({ name, size, stroke, fill, style, className }) {
  const d = PATHS[name];
  return (
    <svg className={className} viewBox="0 0 24 24" width={size || 24} height={size || 24}
      fill={(name === 'play' || name === 'pause') ? 'currentColor' : (fill || 'none')}
      stroke={(name === 'play' || name === 'pause') ? 'none' : (stroke || 'currentColor')}
      strokeWidth={stroke === 'none' ? 0 : 1.9} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

/* ---- Generated typographic cover ---- */
export function Cover({ book, foot }) {
  const p = book.palette;
  return (
    <div className="cover-wrap">
      <div className="cover" style={{ '--cv-bg': p.bg, '--cv-bg2': p.bg2, '--cv-fg': p.fg, '--cv-accent': p.accent }}>
        <div className="cv-top">
          <span className="cv-mark">م</span>
        </div>
        <div className="cv-body">
          <div className="cv-title">{book.title}</div>
          <div className="cv-rule"></div>
          <div className="cv-author">{book.author}</div>
        </div>
        <div className="cv-foot">{foot || 'الموسوعة الذكية'}</div>
      </div>
    </div>
  );
}

/* ---- Equalizer ---- */
export function Equalizer({ paused }) {
  return <span className={'eq' + (paused ? ' paused' : '')}><span></span><span></span><span></span><span></span></span>;
}

/* ---- Progress ring (continue listening) ---- */
export function Ring({ pct, size = 52 }) {
  const r = (size - 5) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gold)" strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
    </svg>
  );
}
