/* ===== owner.jsx — owner portal ===== */
import { useState } from 'react';
import { Icon, Cover, fmtDur, fmtNumFull, fmtDate } from './utils.jsx';
import { BOOKS, CATEGORIES, MESSAGES, bookById, catName } from './data.js';
import { useApp } from './store.jsx';
import { Field } from './components.jsx';

function OwnerLogin() {
  const { navigate, pushToast } = useApp();
  const [email, setEmail] = useState('hikmat@future10x.com');
  const [pw, setPw] = useState('••••••••');
  return (
    <div className="owner-login">
      <div className="owner-login-card card">
        <div className="wordmark" style={{ textAlign: 'center', marginBottom: 6 }}>الموسوعة الذكية</div>
        <div className="center muted" style={{ fontSize: 14, marginBottom: 26 }}>بوّابة الناشر</div>
        <form onSubmit={e => { e.preventDefault(); navigate('owner-dash'); }}>
          <Field label="البريد الإلكتروني"><input value={email} onChange={e => setEmail(e.target.value)} dir="ltr" style={{ textAlign: 'right' }} /></Field>
          <Field label="كلمة المرور"><input type="password" value={pw} onChange={e => setPw(e.target.value)} /></Field>
          <button className="btn btn-primary btn-block btn-lg" type="submit" style={{ marginTop: 8 }}><Icon name="lock" size={18} /> تسجيل الدخول</button>
        </form>
        <button className="btn-ghost btn-sm" style={{ width: '100%', marginTop: 14 }} onClick={() => navigate('home')}>← العودة إلى الموقع</button>
      </div>
    </div>
  );
}

function OwnerShell({ active, children }) {
  const { navigate } = useApp();
  const nav = [
    { v: 'owner-dash', l: 'لوحة التحكم', ic: 'chart' },
    { v: 'owner-content', l: 'المحتوى', ic: 'book' },
    { v: 'owner-edit', l: 'إضافة ملخّص', ic: 'plus' },
    { v: 'owner-messages', l: 'الرسائل', ic: 'inbox' },
    { v: 'owner-settings', l: 'الإعدادات', ic: 'settings' },
  ];
  const unread = MESSAGES.filter(m => !m.read).length;
  return (
    <div className="owner-wrap">
      <aside className="owner-side">
        <div className="wordmark" style={{ fontSize: 21, padding: '0 8px 4px' }} onClick={() => navigate('owner-dash')}>الموسوعة</div>
        <div className="faint" style={{ fontSize: 12, padding: '0 8px 20px' }}>بوّابة الناشر</div>
        <nav className="owner-nav">
          {nav.map(n => (
            <button key={n.v} className={active === n.v ? 'on' : ''} onClick={() => navigate(n.v)}>
              <Icon name={n.ic} size={20} /> <span className="grow" style={{ textAlign: 'start' }}>{n.l}</span>
              {n.v === 'owner-messages' && unread > 0 && <span className="nav-badge tnum">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="owner-side-foot">
          <button className="owner-user"><span className="ou-av display">ح</span><span style={{ textAlign: 'start' }}><b style={{ fontSize: 14 }}>د. حكمت بعيني</b><br /><span className="faint" style={{ fontSize: 12 }}>الناشر</span></span></button>
          <button className="btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('home')}><Icon name="logout" size={16} /> خروج</button>
        </div>
      </aside>
      <main className="owner-main">{children}</main>
    </div>
  );
}

function OwnerDash() {
  const { navigate } = useApp();
  const total = BOOKS.length;
  const totalListens = BOOKS.reduce((s, b) => s + b.listens, 0);
  const drafts = 3, published = total;
  const unread = MESSAGES.filter(m => !m.read).length;
  const stats = [
    { l: 'إجمالي الملخّصات', n: total, ic: 'book', sub: 'منشور' },
    { l: 'إجمالي مرّات الاستماع', n: fmtNumFull(totalListens), ic: 'headphones', sub: '+12% هذا الشهر', good: true },
    { l: 'منشور / مسودّات', n: published + ' / ' + drafts, ic: 'layers', sub: '' },
    { l: 'رسائل جديدة', n: unread, ic: 'inbox', sub: 'بانتظار الردّ' },
  ];
  const top = [...BOOKS].sort((a, b) => b.listens - a.listens).slice(0, 5);
  return (
    <OwnerShell active="owner-dash">
      <div className="owner-head">
        <div><h1 className="owner-h1">لوحة التحكم</h1><p className="muted">مرحباً د. حكمت — إليك نظرة سريعة على منصّتك.</p></div>
        <button className="btn btn-primary" onClick={() => navigate('owner-edit')}><Icon name="plus" size={18} /> إضافة ملخّص جديد</button>
      </div>
      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.l} className="stat-card card">
            <div className="row-between"><span className="stat-ic"><Icon name={s.ic} size={20} /></span></div>
            <div className="stat-n display tnum">{s.n}</div>
            <div className="stat-l">{s.l}</div>
            {s.sub && <div className={'stat-sub' + (s.good ? ' good' : '')}>{s.sub}</div>}
          </div>
        ))}
      </div>
      <div className="owner-cols">
        <div className="card owner-panel">
          <div className="row-between" style={{ marginBottom: 12 }}><h3>الأكثر استماعاً</h3><button className="more" onClick={() => navigate('owner-content')}>عرض الكل</button></div>
          <table className="data-table">
            <tbody>
              {top.map((b, i) => (
                <tr key={b.id} onClick={() => navigate('detail', { id: b.id })}>
                  <td style={{ width: 30 }} className="display gold tnum">{i + 1}</td>
                  <td><b>{b.title}</b><br /><span className="faint" style={{ fontSize: 12.5 }}>{b.author}</span></td>
                  <td className="tnum muted" style={{ textAlign: 'left' }}>{fmtNumFull(b.listens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card owner-panel">
          <h3 style={{ marginBottom: 12 }}>نشاط حديث</h3>
          <div className="activity">
            {[
              { ic: 'plus', t: 'نُشر ملخّص «صناعة إنسانٍ ذكيّ»', d: 'قبل يومين', c: 'jade' },
              { ic: 'inbox', t: 'رسالة جديدة من سارة الحمادي', d: 'قبل يومين', c: 'gold' },
              { ic: 'edit', t: 'تعديل «العادات الذرّية»', d: 'قبل 4 أيام', c: 'muted' },
              { ic: 'headphones', t: 'تجاوز «العادات الذرّية» 48 ألف استماع', d: 'قبل أسبوع', c: 'jade' },
            ].map((a, i) => (
              <div key={i} className="act-row"><span className={'act-ic act-' + a.c}><Icon name={a.ic} size={16} /></span><div className="grow"><div style={{ fontSize: 14.5 }}>{a.t}</div><div className="faint" style={{ fontSize: 12.5 }}>{a.d}</div></div></div>
            ))}
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function OwnerContent() {
  const { navigate, pushToast } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const rows = BOOKS.map((b, i) => ({ ...b, status: i % 6 === 5 ? 'draft' : 'published' }))
    .filter(b => (status === 'all' || b.status === status) && (!q || b.title.includes(q) || b.author.includes(q)));
  return (
    <OwnerShell active="owner-content">
      <div className="owner-head">
        <div><h1 className="owner-h1">المحتوى</h1><p className="muted">كل الملخّصات في مكان واحد.</p></div>
        <button className="btn btn-primary" onClick={() => navigate('owner-edit')}><Icon name="plus" size={18} /> إضافة ملخّص</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="search-box" style={{ maxWidth: 280 }}><span className="s-icon"><Icon name="search" size={18} /></span><input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث…" style={{ height: 42 }} /></div>
          <div className="seg">
            {[['all', 'الكل'], ['published', 'منشور'], ['draft', 'مسودّة']].map(([v, l]) => <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>)}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table data-table-full">
            <thead><tr><th>الملخّص</th><th>التصنيف</th><th>الحالة</th><th>الاستماع</th><th>التاريخ</th><th></th></tr></thead>
            <tbody>
              {rows.map(b => (
                <tr key={b.id}>
                  <td><div className="row" style={{ gap: 10 }}><span style={{ width: 30, flex: 'none' }}><Cover book={b} /></span><span><b>{b.title}</b><br /><span className="faint" style={{ fontSize: 12.5 }}>{b.author}</span></span></div></td>
                  <td className="muted">{catName(b.cat)}</td>
                  <td><span className={'status-dot ' + b.status}>{b.status === 'published' ? 'منشور' : 'مسودّة'}</span></td>
                  <td className="tnum muted">{fmtNumFull(b.listens)}</td>
                  <td className="muted tnum" style={{ whiteSpace: 'nowrap' }}>{fmtDate(b.date)}</td>
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => navigate('owner-edit', { id: b.id })} aria-label="تعديل"><Icon name="edit" size={18} /></button>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => navigate('detail', { id: b.id })} aria-label="معاينة"><Icon name="eye" size={18} /></button>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => pushToast('تم الحذف (تجريبي)')} aria-label="حذف"><Icon name="trash" size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </OwnerShell>
  );
}

function OwnerEdit() {
  const { route, navigate, pushToast } = useApp();
  const editing = route.params.id ? bookById(route.params.id) : null;
  const [f, setF] = useState(() => editing ? {
    title: editing.title, author: editing.author, cat: editing.cat, tags: [...editing.tags],
    teaser: editing.teaser, body: editing.fullText.join('\n\n'), ideas: editing.keyIdeas.map(k => k.t),
    status: 'published', featured: editing.featured,
  } : { title: '', author: '', cat: 'self', tags: [], teaser: '', body: '', ideas: [''], status: 'draft', featured: false });
  const [tagInput, setTagInput] = useState('');
  const upd = (k, v) => setF(s => ({ ...s, [k]: v }));
  const addTag = () => { const t = tagInput.trim(); if (t && !f.tags.includes(t)) { upd('tags', [...f.tags, t]); setTagInput(''); } };
  const setIdea = (i, v) => upd('ideas', f.ideas.map((x, j) => j === i ? v : x));
  const addIdea = () => upd('ideas', [...f.ideas, '']);
  const rmIdea = (i) => upd('ideas', f.ideas.filter((_, j) => j !== i));

  return (
    <OwnerShell active={editing ? 'owner-content' : 'owner-edit'}>
      <div className="owner-head">
        <div>
          <button className="back-link" onClick={() => navigate('owner-content')}><Icon name="chevR" size={18} /> المحتوى</button>
          <h1 className="owner-h1">{editing ? 'تعديل ملخّص' : 'إضافة ملخّص جديد'}</h1>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <span className="autosave"><Icon name="check" size={14} /> حُفظ تلقائياً</span>
          <button className="btn btn-secondary" onClick={() => editing && navigate('detail', { id: editing.id })}><Icon name="eye" size={16} /> معاينة</button>
          <button className="btn btn-primary" onClick={() => { pushToast(f.status === 'published' ? 'تم نشر الملخّص' : 'حُفظت المسودّة'); navigate('owner-content'); }}>{f.status === 'published' ? 'نشر' : 'حفظ'}</button>
        </div>
      </div>

      <div className="edit-grid">
        <div className="stack" style={{ gap: 20 }}>
          <div className="card edit-card">
            <h3 className="edit-h">الملف الصوتي</h3>
            <div className="dropzone">
              <Icon name="upload" size={28} className="gold" />
              <div style={{ fontWeight: 600, marginTop: 8 }}>اسحب الملف الصوتي هنا</div>
              <div className="faint" style={{ fontSize: 13 }}>MP3 أو M4A — حتى 200MB</div>
              {editing && <div className="waveform">{Array.from({ length: 64 }).map((_, i) => <span key={i} style={{ height: (15 + Math.abs(Math.sin(i * 0.7)) * 75) + '%' }}></span>)}</div>}
              {editing && <div className="row-between" style={{ marginTop: 10, fontSize: 13 }}><span className="muted">audio_{editing.id}.mp3</span><span className="tnum gold">{fmtDur(editing.dur)}</span></div>}
            </div>
          </div>

          <div className="card edit-card">
            <h3 className="edit-h">المعلومات الأساسية</h3>
            <Field label="العنوان"><input value={f.title} onChange={e => upd('title', e.target.value)} placeholder="عنوان الكتاب" /></Field>
            <div className="field-row">
              <Field label="المؤلّف"><input value={f.author} onChange={e => upd('author', e.target.value)} placeholder="اسم المؤلّف" /></Field>
              <Field label="التصنيف">
                <select value={f.cat} onChange={e => upd('cat', e.target.value)}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </Field>
            </div>
            <Field label="الوسوم">
              <div className="tag-input">
                {f.tags.map(t => <span key={t} className="chip chip-removable">{t}<button onClick={() => upd('tags', f.tags.filter(x => x !== t))}><Icon name="x" /></button></span>)}
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="أضف وسماً…" />
              </div>
            </Field>
            <Field label="الوصف المختصر (التشويق)"><textarea rows="2" value={f.teaser} onChange={e => upd('teaser', e.target.value)} placeholder="جملة تلخّص جوهر الكتاب…"></textarea></Field>
          </div>

          <div className="card edit-card">
            <h3 className="edit-h">النص الكامل</h3>
            <div className="rte-toolbar">
              <button><b>B</b></button><button><i>I</i></button><button><Icon name="list" size={16} /></button><button>H2</button><span className="faint" style={{ marginInlineStart: 'auto', fontSize: 12.5 }}>يُغذّي لوحة القراءة والبحث في النص</span>
            </div>
            <textarea className="rte" rows="9" value={f.body} onChange={e => upd('body', e.target.value)} placeholder="النص الكامل للملخّص…"></textarea>
          </div>

          <div className="card edit-card">
            <div className="row-between"><h3 className="edit-h" style={{ margin: 0 }}>الأفكار الرئيسية</h3><span className="faint" style={{ fontSize: 12.5 }}>تصبح فصولاً على شريط الصوت</span></div>
            <div className="stack" style={{ gap: 10, marginTop: 14 }}>
              {f.ideas.map((idea, i) => (
                <div key={i} className="idea-input"><span className="idea-input-n display tnum">{i + 1}</span><input value={idea} onChange={e => setIdea(i, e.target.value)} placeholder={'الفكرة ' + (i + 1)} />{f.ideas.length > 1 && <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => rmIdea(i)}><Icon name="x" size={16} /></button>}</div>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={addIdea}><Icon name="plus" size={16} /> إضافة فكرة</button>
          </div>
        </div>

        <div className="stack" style={{ gap: 20 }}>
          <div className="card edit-card">
            <h3 className="edit-h">النشر</h3>
            <Field label="الحالة">
              <div className="seg seg-block">
                <button className={f.status === 'draft' ? 'on' : ''} onClick={() => upd('status', 'draft')}>مسودّة</button>
                <button className={f.status === 'published' ? 'on' : ''} onClick={() => upd('status', 'published')}>منشور</button>
              </div>
            </Field>
            <label className="toggle-row">
              <span><b>ملخّص مميّز</b><br /><span className="faint" style={{ fontSize: 12.5 }}>يظهر في صدر الصفحة الرئيسية</span></span>
              <button className={'switch' + (f.featured ? ' on' : '')} onClick={() => upd('featured', !f.featured)}><span></span></button>
            </label>
          </div>
          <div className="card edit-card">
            <h3 className="edit-h">صورة الغلاف</h3>
            <div className="dropzone dropzone-cover">
              {editing ? <div style={{ width: 110, margin: '0 auto' }}><Cover book={editing} /></div> : <><Icon name="image" size={28} className="gold" /><div className="faint" style={{ fontSize: 13, marginTop: 8 }}>ارفع صورة بنسبة 3:4</div></>}
            </div>
            <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 12 }}><Icon name="upload" size={16} /> رفع صورة</button>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function OwnerMessages() {
  const [sel, setSel] = useState(MESSAGES[0]);
  const [readIds, setReadIds] = useState(MESSAGES.filter(m => m.read).map(m => m.id));
  const open = (m) => { setSel(m); setReadIds(ids => ids.includes(m.id) ? ids : [...ids, m.id]); };
  return (
    <OwnerShell active="owner-messages">
      <div className="owner-head"><div><h1 className="owner-h1">الرسائل</h1><p className="muted">رسائل نموذج التواصل.</p></div></div>
      <div className="messages-layout">
        <div className="card msg-list">
          {MESSAGES.map(m => (
            <button key={m.id} className={'msg-item' + (sel.id === m.id ? ' on' : '') + (readIds.includes(m.id) ? '' : ' unread')} onClick={() => open(m)}>
              <div className="row-between"><b style={{ fontSize: 14.5 }}>{m.name}</b><span className="faint tnum" style={{ fontSize: 12 }}>{fmtDate(m.date)}</span></div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.subject}</div>
              <div className="faint" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.body}</div>
            </button>
          ))}
        </div>
        <div className="card msg-view">
          <div className="row-between" style={{ marginBottom: 6 }}><h3 style={{ fontSize: 20 }}>{sel.subject}</h3><span className="status-dot published"><Icon name="check" size={13} /> تمّت المعالجة</span></div>
          <div className="msg-from"><span className="ou-av display">{sel.name[0]}</span><div><b>{sel.name}</b><br /><span className="faint" style={{ fontSize: 13 }} dir="ltr">{sel.email}</span></div><span className="faint tnum" style={{ marginInlineStart: 'auto', fontSize: 13 }}>{fmtDate(sel.date)}</span></div>
          <p className="msg-body">{sel.body}</p>
          <div className="row" style={{ gap: 10, marginTop: 'auto', paddingTop: 20 }}>
            <button className="btn btn-primary"><Icon name="mail" size={16} /> ردّ</button>
            <button className="btn btn-secondary"><Icon name="check" size={16} /> وضع علامة كمُعالَجة</button>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function SettingGroup({ icon, title, desc, children }) {
  return (
    <div className="card setting-card">
      <div className="row" style={{ gap: 12, marginBottom: 16 }}>
        <span className="stat-ic"><Icon name={icon} size={20} /></span>
        <div><h3 style={{ fontSize: 17 }}>{title}</h3><div className="faint" style={{ fontSize: 13 }}>{desc}</div></div>
      </div>
      <div className="stack" style={{ gap: 14 }}>{children}</div>
    </div>
  );
}

function OwnerSettings() {
  const { pushToast } = useApp();
  const [numerals, setNumerals] = useState('latin');
  const [theme, setTheme] = useState('light');
  const [speed, setSpeed] = useState('1');
  const [download, setDownload] = useState(false);
  return (
    <OwnerShell active="owner-settings">
      <div className="owner-head"><div><h1 className="owner-h1">الإعدادات</h1><p className="muted">إعدادات المنصّة العامّة.</p></div>
        <button className="btn btn-primary" onClick={() => pushToast('حُفظت الإعدادات')}>حفظ التغييرات</button></div>
      <div className="settings-grid">
        <SettingGroup icon="sparkle" title="العلامة التجارية" desc="الاسم والشعار والمظهر الافتراضي.">
          <Field label="اسم الموقع"><input defaultValue="الموسوعة الذكية" /></Field>
          <Field label="المظهر الافتراضي"><div className="seg seg-block"><button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>نهاري</button><button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>ليلي</button></div></Field>
        </SettingGroup>
        <SettingGroup icon="layers" title="التصنيفات والوسوم" desc="أضف، عدّل، أو رتّب التصنيفات.">
          <div className="row wrap" style={{ gap: 8 }}>{CATEGORIES.map(c => <span key={c.id} className="chip chip-removable">{c.name}<button><Icon name="x" /></button></span>)}</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}><Icon name="plus" size={16} /> تصنيف جديد</button>
        </SettingGroup>
        <SettingGroup icon="speed" title="إعدادات المشغّل" desc="السرعة الافتراضية والتنزيل.">
          <Field label="السرعة الافتراضية"><select value={speed} onChange={e => setSpeed(e.target.value)}>{['0.75','1','1.25','1.5','1.75','2'].map(s => <option key={s} value={s}>{s}×</option>)}</select></Field>
          <label className="toggle-row"><span><b>السماح بالتنزيل</b><br /><span className="faint" style={{ fontSize: 12.5 }}>مغلق افتراضياً</span></span><button className={'switch' + (download ? ' on' : '')} onClick={() => setDownload(d => !d)}><span></span></button></label>
        </SettingGroup>
        <SettingGroup icon="type" title="اللغة والأرقام" desc="نظام الأرقام في الواجهة.">
          <Field label="الأرقام"><div className="seg seg-block"><button className={numerals === 'latin' ? 'on' : ''} onClick={() => setNumerals('latin')}>لاتينية (1, 2, 3)</button><button className={numerals === 'arabic' ? 'on' : ''} onClick={() => setNumerals('arabic')}>عربية (١، ٢، ٣)</button></div></Field>
          <p className="faint" style={{ fontSize: 13 }}>المُختار حالياً: أرقام لاتينية في كل أنحاء الواجهة.</p>
        </SettingGroup>
        <SettingGroup icon="mail" title="معلومات التواصل" desc="تظهر في صفحة الاتصال والتذييل.">
          <div className="field-row"><Field label="البريد"><input defaultValue="hello@smart-encyclopedia.ar" dir="ltr" style={{ textAlign: 'right' }} /></Field><Field label="الهاتف"><input defaultValue="+971 56 522 3700" dir="ltr" style={{ textAlign: 'right' }} /></Field></div>
        </SettingGroup>
        <SettingGroup icon="star" title="المحتوى المميّز" desc="اختر ملخّص الصدارة.">
          <Field label="ملخّص الصفحة الرئيسية"><select defaultValue="atomic-habits">{BOOKS.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select></Field>
        </SettingGroup>
      </div>
    </OwnerShell>
  );
}

export { OwnerLogin, OwnerDash, OwnerContent, OwnerEdit, OwnerMessages, OwnerSettings };
