/* ===== store.jsx — app context, router, player engine ===== */

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function AppProvider({ children }) {
  // ---- routing (state-based) ----
  const [route, setRoute] = useState({ view: 'home', params: {} });
  const [histLen, setHistLen] = useState(0);
  const navigate = useCallback((view, params = {}) => {
    setRoute({ view, params });
    setHistLen(h => h + 1);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ---- theme ----
  const [theme, setTheme] = useLocal('theme', 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // ---- device state ----
  const [favorites, setFavorites] = useLocal('favs', []);
  const [progress, setProgress] = useLocal('progress', {}); // {bookId: seconds}
  const [recent, setRecent] = useLocal('recent', ['التفكير','جيمس كلير','علم النفس']);
  const [speed, setSpeed] = useLocal('speed', 1);

  const toggleFav = useCallback((id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [id, ...f]);
  }, [setFavorites]);
  const isFav = useCallback((id) => favorites.includes(id), [favorites]);

  // ---- player engine ----
  const [trackId, setTrackId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [npOpen, setNpOpen] = useState(false); // now-playing fullscreen
  const [sleepMin, setSleepMin] = useState(0); // 0 = off
  const tickRef = useRef();
  const track = trackId ? window.bookById(trackId) : null;
  const duration = track ? track.dur : 0;

  const playBook = useCallback((id, opts = {}) => {
    const b = window.bookById(id);
    if (!b) return;
    if (trackId === id) { setPlaying(true); if (opts.open) setNpOpen(true); return; }
    setTrackId(id);
    const saved = (window.__progress || {})[id] || 0;
    setPosition(opts.from != null ? opts.from : (saved < b.dur - 5 ? saved : 0));
    setPlaying(true);
    if (opts.open) setNpOpen(true);
  }, [trackId]);

  // keep a ref to progress for playBook resume
  useEffect(() => { window.__progress = progress; }, [progress]);

  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const seek = useCallback((sec) => setPosition(Math.max(0, Math.min(sec, duration))), [duration]);

  // tick
  useEffect(() => {
    clearInterval(tickRef.current);
    if (playing && track) {
      tickRef.current = setInterval(() => {
        setPosition(p => {
          const np = p + 0.5 * speed;
          if (np >= duration) { setPlaying(false); return duration; }
          return np;
        });
      }, 500);
    }
    return () => clearInterval(tickRef.current);
  }, [playing, track, speed, duration]);

  // persist progress (throttled by integer seconds)
  useEffect(() => {
    if (!trackId) return;
    const s = Math.floor(position);
    if (s % 3 === 0) setProgress(pr => ({ ...pr, [trackId]: s }));
  }, [position, trackId, setProgress]);

  // sleep timer
  const sleepRef = useRef();
  useEffect(() => {
    clearTimeout(sleepRef.current);
    if (sleepMin > 0 && playing) {
      sleepRef.current = setTimeout(() => { setPlaying(false); setSleepMin(0); pushToast('انتهى مؤقّت النوم — توقّف التشغيل'); }, sleepMin * 60 * 1000);
    }
    return () => clearTimeout(sleepRef.current);
  }, [sleepMin, playing]);

  // ---- toasts ----
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((msg) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  // current chapter (key idea) from position
  const chapterAt = useCallback((b, pos) => {
    if (!b) return 0;
    const n = b.keyIdeas.length, seg = b.dur / n;
    return Math.min(n - 1, Math.floor(pos / seg));
  }, []);
  const chapterTime = useCallback((b, idx) => (b.dur / b.keyIdeas.length) * idx, []);

  const val = {
    route, navigate, histLen,
    theme, toggleTheme,
    favorites, toggleFav, isFav,
    progress, setProgress, recent, setRecent,
    speed, setSpeed,
    trackId, track, playing, position, duration, npOpen, setNpOpen,
    playBook, togglePlay, seek, setPlaying,
    sleepMin, setSleepMin,
    pushToast, toasts,
    chapterAt, chapterTime,
  };
  return <AppCtx.Provider value={val}>{children}</AppCtx.Provider>;
}

Object.assign(window, { AppCtx, useApp, AppProvider });
