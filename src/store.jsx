/* ===== store.jsx — app context, router, player engine ===== */
import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useLocal } from './utils.jsx';
import { useContent } from './content.jsx';
import { getAudio } from './lib/mediaStore.js';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const { bookById, incrementListens, settings } = useContent();   // content lives in the surrounding ContentProvider

  // ---- routing ----
  const [route, setRoute] = useState({ view: 'home', params: {} });
  const navigate = useCallback((view, params = {}) => {
    setRoute({ view, params });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ---- theme ---- (first-visit default seeded from owner settings)
  const [theme, setTheme] = useLocal('theme', settings.default_theme || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // ---- device state ----
  const [favorites, setFavorites] = useLocal('favs', []);
  const [progress, setProgress] = useLocal('progress', {});
  const [recent, setRecent] = useLocal('recent', ['التفكير', 'جيمس كلير', 'علم النفس']);
  const [speed, setSpeed] = useLocal('speed', settings.default_speed || 1);

  const toggleFav = useCallback((id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [id, ...f]);
  }, [setFavorites]);
  const isFav = useCallback((id) => favorites.includes(id), [favorites]);

  // ---- player engine (hybrid: real <audio> when a file exists, else simulated) ----
  const [trackId, setTrackId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [npOpen, setNpOpen] = useState(false);
  const [sleepMin, setSleepMin] = useState(0);
  const tickRef = useRef();
  const countedRef = useRef(new Set());   // listens counted once per summary per session
  const audioRef = useRef(null);
  const objUrlRef = useRef(null);
  const pendingSeekRef = useRef(0);
  const isRealRef = useRef(false);

  const track = trackId ? bookById(trackId) : null;
  const isReal = !!(track && track.audioPath);                 // a real uploaded audio file exists
  const duration = track ? ((isReal && mediaDuration) ? mediaDuration : track.dur) : 0;
  useEffect(() => { isRealRef.current = isReal; }, [isReal]);

  const safePlay = useCallback((el) => {
    try { const p = el.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch { /* ignore */ }
  }, []);

  // one <audio> element drives real playback (created on the client only)
  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const a = new Audio(); audioRef.current = a;
    const onTime = () => { if (isRealRef.current) setPosition(a.currentTime || 0); };
    const onMeta = () => { setMediaDuration(a.duration || 0); if (pendingSeekRef.current) { try { a.currentTime = pendingSeekRef.current; } catch {} pendingSeekRef.current = 0; } };
    const onEnded = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    return () => { try { a.pause(); } catch {} a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('ended', onEnded); };
  }, []);

  // keep a ref to progress for playBook resume
  const progressRef = useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  const playBook = useCallback(async (id, opts = {}) => {
    const b = bookById(id);
    if (!b) return;
    if (!countedRef.current.has(id)) { countedRef.current.add(id); incrementListens(id); }
    if (trackId === id) {                                       // resume current track
      if (b.audioPath && audioRef.current) safePlay(audioRef.current);
      setPlaying(true);
      if (opts.open) setNpOpen(true);
      return;
    }
    clearInterval(tickRef.current);                            // switch: stop both engines
    try { audioRef.current && audioRef.current.pause(); } catch {}
    setMediaDuration(0);
    setTrackId(id);
    const saved = (progressRef.current || {})[id] || 0;
    const startAt = opts.from != null ? opts.from : (saved < b.dur - 5 ? saved : 0);
    setPosition(startAt);
    if (opts.open) setNpOpen(true);
    if (b.audioPath) {                                         // real audio from IndexedDB
      const blob = await getAudio(id);
      const a = audioRef.current;
      if (blob && a) {
        if (objUrlRef.current) { try { URL.revokeObjectURL(objUrlRef.current); } catch {} }
        objUrlRef.current = URL.createObjectURL(blob);
        pendingSeekRef.current = startAt;
        a.src = objUrlRef.current;
        a.playbackRate = speed;
        safePlay(a);
        setPlaying(true);
        return;
      }
    }
    setPlaying(true);                                          // simulated fallback
  }, [trackId, bookById, incrementListens, speed, safePlay]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (isReal && a) {
      if (a.paused) { safePlay(a); setPlaying(true); } else { try { a.pause(); } catch {} setPlaying(false); }
    } else setPlaying(p => !p);
  }, [isReal, safePlay]);

  const seek = useCallback((sec) => {
    const t = Math.max(0, Math.min(sec, duration));
    if (isReal && audioRef.current) { try { audioRef.current.currentTime = t; } catch {} }
    setPosition(t);
  }, [duration, isReal]);

  // simulated tick — only for tracks WITHOUT a real audio file
  useEffect(() => {
    clearInterval(tickRef.current);
    if (playing && track && !isReal) {
      tickRef.current = setInterval(() => {
        setPosition(p => {
          const np = p + 0.5 * speed;
          if (np >= duration) { setPlaying(false); return duration; }
          return np;
        });
      }, 500);
    }
    return () => clearInterval(tickRef.current);
  }, [playing, track, isReal, speed, duration]);

  // real-audio playback rate follows speed
  useEffect(() => { if (audioRef.current && isReal) audioRef.current.playbackRate = speed; }, [speed, isReal]);

  // persist progress
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
      sleepRef.current = setTimeout(() => {
        try { audioRef.current && audioRef.current.pause(); } catch {}
        setPlaying(false);
        setSleepMin(0);
        pushToast('انتهى مؤقّت النوم — توقّف التشغيل');
      }, sleepMin * 60 * 1000);
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

  // chapter helpers
  const chapterAt = useCallback((b, pos) => {
    if (!b || !b.keyIdeas.length) return 0;
    const n = b.keyIdeas.length, seg = b.dur / n;
    return Math.max(0, Math.min(n - 1, Math.floor(pos / seg)));
  }, []);
  const chapterTime = useCallback((b, idx) => (b && b.keyIdeas.length) ? (b.dur / b.keyIdeas.length) * idx : 0, []);

  const val = {
    route, navigate,
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
