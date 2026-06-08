/* ===== player.jsx — mini player + Now Playing (dark) ===== */

function MiniPlayer() {
  const { track, playing, togglePlay, position, duration, setNpOpen, navigate } = useApp();
  if (!track) return null;
  const pct = duration ? (position / duration) * 100 : 0;
  return (
    <div className="mini-player" onClick={() => setNpOpen(true)}>
      <div className="mini-prog"><i style={{ width: pct + '%' }}></i></div>
      <div className="mini-body">
        <div className="cover-wrap" style={{ width: 40, flex: 'none' }}><Cover book={track} /></div>
        <div className="mini-meta">
          <div className="mt">{track.title}</div>
          <div className="ma tnum">{fmtTime(position)} / {fmtTime(duration)}</div>
        </div>
        <Equalizer paused={!playing} />
        <button className="mini-play" onClick={(e) => { e.stopPropagation(); togglePlay(); }} aria-label={playing ? 'إيقاف' : 'تشغيل'}>
          <Icon name={playing ? 'pause' : 'play'} size={20} />
        </button>
        <button className="icon-btn desktop-only" onClick={(e) => { e.stopPropagation(); setNpOpen(true); }} aria-label="توسيع"><Icon name="chevDown" style={{ transform: 'rotate(180deg)' }} /></button>
      </div>
    </div>
  );
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEPS = [15, 30, 45, 60];

function NowPlaying() {
  const { track, playing, togglePlay, position, duration, seek, setNpOpen, npOpen,
    speed, setSpeed, sleepMin, setSleepMin, isFav, toggleFav, chapterAt, chapterTime, navigate, pushToast } = useApp();
  const [showSpeed, setShowSpeed] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const barRef = useRef();
  if (!track) return null;
  const curCh = chapterAt(track, position);
  const onScrub = (e) => {
    const rect = barRef.current.getBoundingClientRect();
    // RTL: progress fills right→left
    const ratio = (rect.right - e.clientX) / rect.width;
    seek(Math.max(0, Math.min(1, ratio)) * duration);
  };
  const jumpCh = (i) => { seek(chapterTime(track, i)); };
  const pct = duration ? (position / duration) * 100 : 0;

  return (
    <div className={'np' + (npOpen ? ' open' : '')} data-theme="dark">
      <div className="np-pattern"></div>
      <div className="np-inner">
        <div className="np-top">
          <button className="icon-btn" onClick={() => setNpOpen(false)} aria-label="إغلاق"><Icon name="chevDown" /></button>
          <div className="np-eyebrow">يُشغَّل الآن · {window.catName(track.cat)}</div>
          <button className="icon-btn" onClick={() => { setNpOpen(false); navigate('detail', { id: track.id }); }} aria-label="القائمة"><Icon name="bookOpen" /></button>
        </div>

        <div className="np-cover"><Cover book={track} /></div>

        <div className="np-info">
          <h2>{track.title}</h2>
          <div className="np-author">{track.author}</div>
        </div>

        <div className="np-current">
          <span className="eyebrow gold">الفكرة {curCh + 1} من {track.keyIdeas.length}</span>
          <div className="np-chtitle">{track.keyIdeas[curCh].t}</div>
        </div>

        {/* scrubber */}
        <div className="np-scrub">
          <div className="np-bar" ref={barRef} onClick={onScrub}>
            <div className="np-fill" style={{ width: pct + '%' }}></div>
            {track.keyIdeas.map((k, i) => {
              const p = (chapterTime(track, i) / duration) * 100;
              return <span key={i} className={'np-marker' + (i === curCh ? ' on' : '')} style={{ insetInlineEnd: p + '%' }} title={k.t} onClick={(e) => { e.stopPropagation(); jumpCh(i); }}></span>;
            })}
            <span className="np-knob" style={{ insetInlineEnd: pct + '%' }}></span>
          </div>
          <div className="np-times tnum"><span>{fmtTime(position)}</span><span>-{fmtTime(duration - position)}</span></div>
        </div>

        {/* main controls */}
        <div className="np-controls">
          <button className="icon-btn np-ctl" onClick={() => jumpCh(Math.max(0, curCh - 1))} aria-label="الفكرة السابقة"><Icon name="prev" size={26} /></button>
          <button className="icon-btn np-ctl" onClick={() => seek(position - 15)} aria-label="رجوع 15 ثانية"><Icon name="skip15B" size={28} /><span className="np-15">15</span></button>
          <button className="np-bigplay" onClick={togglePlay} aria-label={playing ? 'إيقاف' : 'تشغيل'}><Icon name={playing ? 'pause' : 'play'} size={32} /></button>
          <button className="icon-btn np-ctl" onClick={() => seek(position + 15)} aria-label="تقديم 15 ثانية"><Icon name="skip15F" size={28} /><span className="np-15">15</span></button>
          <button className="icon-btn np-ctl" onClick={() => jumpCh(Math.min(track.keyIdeas.length - 1, curCh + 1))} aria-label="الفكرة التالية"><Icon name="next" size={26} /></button>
        </div>

        {/* secondary controls */}
        <div className="np-secondary">
          <div style={{ position: 'relative' }}>
            <button className="np-pillbtn" onClick={() => { setShowSpeed(s => !s); setShowSleep(false); }}><Icon name="speed" size={18} /> <span className="tnum">{speed}×</span></button>
            {showSpeed && <div className="np-pop">{SPEEDS.map(s => <button key={s} className={s === speed ? 'on' : ''} onClick={() => { setSpeed(s); setShowSpeed(false); }}>{s}×</button>)}</div>}
          </div>
          <div style={{ position: 'relative' }}>
            <button className={'np-pillbtn' + (sleepMin ? ' active' : '')} onClick={() => { setShowSleep(s => !s); setShowSpeed(false); }}><Icon name="timer" size={18} /> {sleepMin ? sleepMin + ' د' : 'مؤقّت'}</button>
            {showSleep && <div className="np-pop">
              {SLEEPS.map(m => <button key={m} className={m === sleepMin ? 'on' : ''} onClick={() => { setSleepMin(m); setShowSleep(false); pushToast('سيتوقّف التشغيل بعد ' + m + ' دقيقة'); }}>{m} دقيقة</button>)}
              <button onClick={() => { setSleepMin(0); setShowSleep(false); }}>إيقاف المؤقّت</button>
            </div>}
          </div>
          <button className={'np-pillbtn' + (isFav(track.id) ? ' active' : '')} onClick={() => toggleFav(track.id)}><Icon name="heart" size={18} fill={isFav(track.id) ? 'currentColor' : 'none'} /> {isFav(track.id) ? 'في المفضّلة' : 'أضف'}</button>
          <button className="np-pillbtn" onClick={() => pushToast('تم نسخ رابط الملخّص')}><Icon name="share" size={18} /> مشاركة</button>
        </div>

        {/* chapter list */}
        <div className="np-chapters">
          <div className="np-chapters-h">الأفكار الرئيسية</div>
          {track.keyIdeas.map((k, i) => (
            <button key={i} className={'np-chrow' + (i === curCh ? ' on' : '')} onClick={() => jumpCh(i)}>
              <span className="np-chnum">{i === curCh && playing ? <Equalizer /> : (i + 1)}</span>
              <span className="np-chtxt">{k.t}</span>
              <span className="np-chtime tnum">{fmtTime(chapterTime(track, i))}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MiniPlayer, NowPlaying });
