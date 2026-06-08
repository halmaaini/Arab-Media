/* ===== owner.jsx — owner portal (functional, local persistence) ===== */
import { useState } from 'react';
import { Icon, Cover, fmtDur, fmtNumFull, fmtDate } from './utils.jsx';
import { useContent } from './content.jsx';
import { useApp } from './store.jsx';
import { Field } from './components.jsx';
import { paletteOf, PALETTE_KEYS } from './lib/palettes.js';
import { makeSlug } from './lib/contentStore.js';

function OwnerLogin() {
  const { navigate } = useApp();
  const [email, setEmail] = useState('hikmat@future10x.com');
  const [pw, setPw] = useState('••••••••');
  // Prototype auth: any input proceeds. Real Supabase Auth lands later (docs/04).
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
  const { unreadCount } = useContent();
  const nav = [
    { v: 'owner-dash', l: 'لوحة التحكم', ic: 'chart' },
    { v: 'owner-content', l: 'المحتوى', ic: 'book' },
    { v: 'owner-edit', l: 'إضافة ملخّص', ic: 'plus' },
    { v: 'owner-messages', l: 'الرسائل', ic: 'inbox' },
    { v: 'owner-settings', l: 'الإعدادات', ic: 'settings' },
  ];
  return (
    <div className="owner-wrap">
      <aside className="owner-side">
        <div className="wordmark" style={{ fontSize: 21, padding: '0 8px 4px' }} onClick={() => navigate('owner-dash')}>الموسوعة</div>
        <div className="faint" style={{ fontSize: 12, padding: '0 8px 20px' }}>بوّابة الناشر</div>
        <nav className="owner-nav">
          {nav.map(n => (
            <button key={n.v} className={active === n.v ? 'on' : ''} onClick={() => navigate(n.v)}>
              <Icon name={n.ic} size={20} /> <span className="grow" style={{ textAlign: 'start' }}>{n.l}</span>
              {n.v === 'owner-messages' && unreadCount > 0 && <span className="nav-badge tnum">{unreadCount}</span>}
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
  const { allBooks, unreadCount } = useContent();
  const published = allBooks.filter(b => b.status === 'published');
  const drafts = allBooks.filter(b => b.status === 'draft').length;
  const totalListens = allBooks.reduce((s, b) => s + b.listens, 0);
  const stats = [
    { l: 'إجمالي الملخّصات', n: allBooks.length, ic: 'book', sub: published.length + ' منشور' },
    { l: 'إجمالي مرّات الاستماع', n: fmtNumFull(totalListens), ic: 'headphones', sub: '' },
    { l: 'منشور / مسودّات', n: published.length + ' / ' + drafts, ic: 'layers', sub: '' },
    { l: 'رسائل جديدة', n: unreadCount, ic: 'inbox', sub: unreadCount ? 'بانتظار الردّ' : 'لا جديد' },
  ];
  const top = [...published].sort((a, b) => b.listens - a.listens).slice(0, 5);
  const recent = [...allBooks].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4);
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
            {s.sub && <div className="stat-sub">{s.sub}</div>}
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
          <h3 style={{ marginBottom: 12 }}>أحدث المحتوى</h3>
          <div className="activity">
            {recent.map((b) => (
              <div key={b.id} className="act-row" onClick={() => navigate('owner-edit', { id: b.id })} style={{ cursor: 'pointer' }}>
                <span className={'act-ic act-' + (b.status === 'published' ? 'jade' : 'muted')}><Icon name={b.status === 'published' ? 'check' : 'edit'} size={16} /></span>
                <div className="grow"><div style={{ fontSize: 14.5 }}>«{b.title}»</div><div className="faint" style={{ fontSize: 12.5 }}>{b.status === 'published' ? 'منشور' : 'مسودّة'} · {b.author}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function OwnerContent() {
  const { navigate, pushToast } = useApp();
  const { allBooks, catName, deleteSummary, setStatus } = useContent();
  const [q, setQ] = useState('');
  const [status, setStatusFilter] = useState('all');
  const rows = allBooks.filter(b =>
    (status === 'all' || b.status === status) && (!q || b.title.includes(q) || b.author.includes(q)));
  const del = (b) => { if (window.confirm('حذف «' + b.title + '»؟')) { deleteSummary(b.slug); pushToast('تم الحذف'); } };
  const toggle = (b) => { setStatus(b.slug, b.status === 'published' ? 'draft' : 'published'); pushToast(b.status === 'published' ? 'حُوّل إلى مسودّة' : 'تم النشر'); };
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
            {[['all', 'الكل'], ['published', 'منشور'], ['draft', 'مسودّة']].map(([v, l]) => <button key={v} className={status === v ? 'on' : ''} onClick={() => setStatusFilter(v)}>{l}</button>)}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table data-table-full">
            <thead><tr><th>الملخّص</th><th>التصنيف</th><th>الحالة</th><th>الاستماع</th><th>التاريخ</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="6" className="muted center" style={{ padding: 28 }}>لا ملخّصات مطابقة.</td></tr>}
              {rows.map(b => (
                <tr key={b.id}>
                  <td><div className="row" style={{ gap: 10 }}><span style={{ width: 30, flex: 'none' }}><Cover book={b} /></span><span><b>{b.title}</b><br /><span className="faint" style={{ fontSize: 12.5 }}>{b.author}</span></span></div></td>
                  <td className="muted">{catName(b.cat)}</td>
                  <td><span className={'status-dot ' + b.status}>{b.status === 'published' ? 'منشور' : 'مسودّة'}</span></td>
                  <td className="tnum muted">{fmtNumFull(b.listens)}</td>
                  <td className="muted tnum" style={{ whiteSpace: 'nowrap' }}>{b.date ? fmtDate(b.date) : '—'}</td>
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => toggle(b)} aria-label="نشر/مسودّة" title={b.status === 'published' ? 'تحويل إلى مسودّة' : 'نشر'}><Icon name={b.status === 'published' ? 'eye' : 'check'} size={18} /></button>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => navigate('owner-edit', { id: b.id })} aria-label="تعديل"><Icon name="edit" size={18} /></button>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => navigate('detail', { id: b.id })} aria-label="معاينة"><Icon name="eye" size={18} /></button>
                      <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => del(b)} aria-label="حذف"><Icon name="trash" size={18} /></button>
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
  const { bookById, categories, createSummary, updateSummary } = useContent();
  const editing = route.params.id ? bookById(route.params.id) : null;
  const [f, setF] = useState(() => editing ? {
    title: editing.title, author: editing.author, cat: editing.cat, tags: [...editing.tags],
    teaser: editing.teaser, body: editing.fullText.join('\n\n'),
    ideas: editing.keyIdeas.map(k => ({ t: k.t, x: k.x })),
    palette_key: editing.palette_key || 'ink', status: editing.status || 'published', featured: editing.featured,
  } : { title: '', author: '', cat: categories[0]?.id || 'self', tags: [], teaser: '', body: '', ideas: [{ t: '', x: '' }], palette_key: 'ink', status: 'draft', featured: false });
  const [tagInput, setTagInput] = useState('');
  const upd = (k, v) => setF(s => ({ ...s, [k]: v }));
  const addTag = () => { const t = tagInput.trim(); if (t && !f.tags.includes(t)) { upd('tags', [...f.tags, t]); setTagInput(''); } };
  const setIdea = (i, key, v) => upd('ideas', f.ideas.map((x, j) => j === i ? { ...x, [key]: v } : x));
  const addIdea = () => upd('ideas', [...f.ideas, { t: '', x: '' }]);
  const rmIdea = (i) => upd('ideas', f.ideas.filter((_, j) => j !== i));

  const preview = paletteOf(f.palette_key);
  const previewBook = { title: f.title || 'عنوان الملخّص', author: f.author || 'المؤلّف', palette: preview };

  const save = () => {
    if (!f.title.trim()) { pushToast('العنوان مطلوب'); return; }
    const key_ideas = f.ideas.map(i => ({ title: i.t.trim(), body: i.x.trim() })).filter(k => k.title);
    const body_paragraphs = f.body.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (f.status === 'published' && (!f.teaser.trim() || key_ideas.length < 3 || body_paragraphs.length < 1)) {
      pushToast('للنشر: وصف مختصر + 3 أفكار على الأقل + نص'); return;
    }
    const canonical = {
      title: f.title.trim(), author: f.author.trim(), category_id: f.cat, tags: f.tags,
      teaser: f.teaser.trim(), key_ideas, body_paragraphs, palette_key: f.palette_key,
      featured: f.featured, status: f.status,
      audio_duration_seconds: editing?.dur || Math.max(300, key_ideas.length * 150),
    };
    if (editing) updateSummary(editing.slug, canonical);
    else createSummary(canonical);
    pushToast(f.status === 'published' ? 'تم نشر الملخّص' : 'حُفظت المسودّة');
    navigate('owner-content');
  };

  return (
    <OwnerShell active={editing ? 'owner-content' : 'owner-edit'}>
      <div className="owner-head">
        <div>
          <button className="back-link" onClick={() => navigate('owner-content')}><Icon name="chevR" size={18} /> المحتوى</button>
          <h1 className="owner-h1">{editing ? 'تعديل ملخّص' : 'إضافة ملخّص جديد'}</h1>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {editing && <button className="btn btn-secondary" onClick={() => navigate('detail', { id: editing.id })}><Icon name="eye" size={16} /> معاينة</button>}
          <button className="btn btn-primary" onClick={save}>{f.status === 'published' ? 'نشر' : 'حفظ المسودّة'}</button>
        </div>
      </div>

      <div className="edit-grid">
        <div className="stack" style={{ gap: 20 }}>
          <div className="card edit-card">
            <h3 className="edit-h">الملف الصوتي</h3>
            <div className="dropzone">
              <Icon name="upload" size={28} className="gold" />
              <div style={{ fontWeight: 600, marginTop: 8 }}>رفع الصوت يتفعّل مع ربط الخادم</div>
              <div className="faint" style={{ fontSize: 13 }}>MP3 أو M4A — حتى 200MB (في النموذج الحالي يُعرض كـ«قيد الإعداد»)</div>
            </div>
          </div>

          <div className="card edit-card">
            <h3 className="edit-h">المعلومات الأساسية</h3>
            <Field label="العنوان"><input value={f.title} onChange={e => upd('title', e.target.value)} placeholder="عنوان الكتاب" /></Field>
            <div className="field-row">
              <Field label="المؤلّف"><input value={f.author} onChange={e => upd('author', e.target.value)} placeholder="اسم المؤلّف" /></Field>
              <Field label="التصنيف">
                <select value={f.cat} onChange={e => upd('cat', e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
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
            <p className="faint" style={{ fontSize: 12.5, marginBottom: 8 }}>افصل الفقرات بسطر فارغ. يُغذّي لوحة القراءة والبحث في النص.</p>
            <textarea className="rte" rows="9" value={f.body} onChange={e => upd('body', e.target.value)} placeholder="النص الكامل للملخّص…"></textarea>
          </div>

          <div className="card edit-card">
            <div className="row-between"><h3 className="edit-h" style={{ margin: 0 }}>الأفكار الرئيسية</h3><span className="faint" style={{ fontSize: 12.5 }}>عنوان + شرح لكل فكرة — تصبح فصولاً على شريط الصوت</span></div>
            <div className="stack" style={{ gap: 14, marginTop: 14 }}>
              {f.ideas.map((idea, i) => (
                <div key={i} className="idea-input" style={{ alignItems: 'flex-start' }}>
                  <span className="idea-input-n display tnum">{i + 1}</span>
                  <div className="grow stack" style={{ gap: 6 }}>
                    <input value={idea.t} onChange={e => setIdea(i, 't', e.target.value)} placeholder={'عنوان الفكرة ' + (i + 1)} />
                    <textarea rows="2" value={idea.x} onChange={e => setIdea(i, 'x', e.target.value)} placeholder="شرح الفكرة…"></textarea>
                  </div>
                  {f.ideas.length > 1 && <button className="icon-btn" style={{ width: 38, height: 38 }} onClick={() => rmIdea(i)}><Icon name="x" size={16} /></button>}
                </div>
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
              <div style={{ width: 110, margin: '0 auto' }}><Cover book={previewBook} /></div>
            </div>
            <div className="filter-h" style={{ marginTop: 14 }}>لوحة الغلاف</div>
            <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
              {PALETTE_KEYS.map(k => (
                <button key={k} onClick={() => upd('palette_key', k)} aria-label={k}
                  style={{ width: 30, height: 30, borderRadius: 8, border: f.palette_key === k ? '2px solid var(--gold)' : '2px solid transparent', background: paletteOf(k).bg, cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}

function OwnerMessages() {
  const { messages, setMessageStatus, deleteMessage } = useContent();
  const { pushToast } = useApp();
  const [selId, setSelId] = useState(messages[0]?.id || null);
  const sel = messages.find(m => m.id === selId) || messages[0] || null;
  const open = (m) => { setSelId(m.id); if (m.status === 'new') setMessageStatus(m.id, 'read'); };
  return (
    <OwnerShell active="owner-messages">
      <div className="owner-head"><div><h1 className="owner-h1">الرسائل</h1><p className="muted">رسائل نموذج التواصل.</p></div></div>
      {messages.length === 0 ? (
        <div className="empty"><div className="e-ico"><Icon name="inbox" /></div><h3>لا رسائل بعد</h3><p>ستظهر هنا الرسائل المُرسَلة من صفحة «اتصل بنا».</p></div>
      ) : (
        <div className="messages-layout">
          <div className="card msg-list">
            {messages.map(m => (
              <button key={m.id} className={'msg-item' + (sel && sel.id === m.id ? ' on' : '') + (m.status === 'new' ? ' unread' : '')} onClick={() => open(m)}>
                <div className="row-between"><b style={{ fontSize: 14.5 }}>{m.name}</b><span className="faint tnum" style={{ fontSize: 12 }}>{fmtDate(m.created_at)}</span></div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.subject}</div>
                <div className="faint" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.body}</div>
              </button>
            ))}
          </div>
          {sel && (
            <div className="card msg-view">
              <div className="row-between" style={{ marginBottom: 6 }}><h3 style={{ fontSize: 20 }}>{sel.subject}</h3>
                {sel.status === 'archived' && <span className="status-dot published"><Icon name="check" size={13} /> تمّت المعالجة</span>}</div>
              <div className="msg-from"><span className="ou-av display">{sel.name[0]}</span><div><b>{sel.name}</b><br /><span className="faint" style={{ fontSize: 13 }} dir="ltr">{sel.email}</span></div><span className="faint tnum" style={{ marginInlineStart: 'auto', fontSize: 13 }}>{fmtDate(sel.created_at)}</span></div>
              <p className="msg-body">{sel.body}</p>
              <div className="row" style={{ gap: 10, marginTop: 'auto', paddingTop: 20 }}>
                <button className="btn btn-primary" onClick={() => pushToast('الردّ عبر البريد يتفعّل مع ربط الخادم')}><Icon name="mail" size={16} /> ردّ</button>
                <button className="btn btn-secondary" onClick={() => { setMessageStatus(sel.id, 'archived'); pushToast('وُضعت علامة كمُعالَجة'); }}><Icon name="check" size={16} /> وضع علامة كمُعالَجة</button>
                <button className="icon-btn" onClick={() => { deleteMessage(sel.id); setSelId(null); }} aria-label="حذف"><Icon name="trash" size={18} /></button>
              </div>
            </div>
          )}
        </div>
      )}
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
  const { categories, books, settings, updateSettings, upsertCategory, deleteCategory, setFeatured } = useContent();
  const featured = books.find(b => b.featured);
  const addCat = () => {
    const name = window.prompt('اسم التصنيف الجديد');
    if (!name || !name.trim()) return;
    upsertCategory({ id: makeSlug(name, categories.map(c => c.id)), name: name.trim(), blurb: '' });
    pushToast('أُضيف التصنيف');
  };
  const removeCat = (id) => {
    const r = deleteCategory(id);
    if (!r.ok) pushToast(r.reason === 'referenced' ? 'لا يمكن حذف تصنيف مستخدَم في ملخّصات' : 'لا يمكن حذف آخر تصنيف');
  };
  const chooseFeatured = (slug) => {
    books.forEach(b => { if (b.featured && b.id !== slug) setFeatured(b.id, false); });
    setFeatured(slug, true);
    pushToast('تم تحديد ملخّص الصدارة');
  };
  return (
    <OwnerShell active="owner-settings">
      <div className="owner-head"><div><h1 className="owner-h1">الإعدادات</h1><p className="muted">إعدادات المنصّة العامّة — تنعكس مباشرة على الموقع.</p></div>
        <button className="btn btn-primary" onClick={() => pushToast('حُفظت الإعدادات')}>تمّ الحفظ</button></div>
      <div className="settings-grid">
        <SettingGroup icon="sparkle" title="المظهر" desc="المظهر الافتراضي للزوّار الجدد.">
          <Field label="المظهر الافتراضي"><div className="seg seg-block">
            <button className={settings.default_theme === 'light' ? 'on' : ''} onClick={() => updateSettings({ default_theme: 'light' })}>نهاري</button>
            <button className={settings.default_theme === 'dark' ? 'on' : ''} onClick={() => updateSettings({ default_theme: 'dark' })}>ليلي</button>
          </div></Field>
        </SettingGroup>
        <SettingGroup icon="layers" title="التصنيفات" desc="أضف أو احذف التصنيفات.">
          <div className="row wrap" style={{ gap: 8 }}>{categories.map(c => <span key={c.id} className="chip chip-removable">{c.name}<button onClick={() => removeCat(c.id)}><Icon name="x" /></button></span>)}</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={addCat}><Icon name="plus" size={16} /> تصنيف جديد</button>
        </SettingGroup>
        <SettingGroup icon="speed" title="إعدادات المشغّل" desc="السرعة الافتراضية.">
          <Field label="السرعة الافتراضية"><select value={String(settings.default_speed || 1)} onChange={e => updateSettings({ default_speed: Number(e.target.value) })}>{['0.75', '1', '1.25', '1.5', '1.75', '2'].map(s => <option key={s} value={s}>{s}×</option>)}</select></Field>
        </SettingGroup>
        <SettingGroup icon="type" title="اللغة والأرقام" desc="نظام الأرقام في الواجهة.">
          <Field label="الأرقام"><div className="seg seg-block"><button className="on">لاتينية (1, 2, 3)</button></div></Field>
          <p className="faint" style={{ fontSize: 13 }}>الواجهة تستخدم الأرقام اللاتينية في كل مكان.</p>
        </SettingGroup>
        <SettingGroup icon="mail" title="معلومات التواصل" desc="تظهر في صفحة الاتصال.">
          <div className="field-row">
            <Field label="البريد"><input value={settings.contact_email || ''} onChange={e => updateSettings({ contact_email: e.target.value })} dir="ltr" style={{ textAlign: 'right' }} /></Field>
            <Field label="الهاتف"><input value={settings.contact_phone || ''} onChange={e => updateSettings({ contact_phone: e.target.value })} dir="ltr" style={{ textAlign: 'right' }} /></Field>
          </div>
        </SettingGroup>
        <SettingGroup icon="star" title="المحتوى المميّز" desc="اختر ملخّص الصدارة.">
          <Field label="ملخّص الصفحة الرئيسية"><select value={featured ? featured.id : ''} onChange={e => chooseFeatured(e.target.value)}>
            <option value="" disabled>اختر…</option>
            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select></Field>
        </SettingGroup>
      </div>
    </OwnerShell>
  );
}

export { OwnerLogin, OwnerDash, OwnerContent, OwnerEdit, OwnerMessages, OwnerSettings };
