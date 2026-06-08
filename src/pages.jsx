/* ===== pages.jsx — library, category, about, publisher, contact, more ===== */
import { useState } from 'react';
import { Icon, Cover, fmtDate } from './utils.jsx';
import { BOOKS, CATEGORIES, OWNER, bookById, catById, catName, booksByCat, catCount } from './data.js';
import { useApp } from './store.jsx';
import { BookCard, Empty, Field } from './components.jsx';
import { ThemeToggle } from './shell.jsx';

export function Library() {
  const { navigate, favorites, progress } = useApp();
  const [tab, setTab] = useState('continue');
  const continueBooks = BOOKS.filter(b => (progress[b.id] || 0) > 5 && (progress[b.id] || 0) < b.dur - 5)
    .sort((a, b) => (progress[b.id] || 0) - (progress[a.id] || 0));
  const favBooks = favorites.map(id => bookById(id)).filter(Boolean);

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-head">
        <h1 className="page-title">مكتبتي</h1>
        <p className="page-sub">محفوظة على هذا الجهاز — لا حاجة لتسجيل الدخول.</p>
      </div>
      <div className="detail-tabs" style={{ marginTop: 0 }}>
        <button className={tab === 'continue' ? 'on' : ''} onClick={() => setTab('continue')}>تابِع الاستماع</button>
        <button className={tab === 'fav' ? 'on' : ''} onClick={() => setTab('fav')}>المفضّلة</button>
      </div>
      {tab === 'continue' ? (
        continueBooks.length ? <div className="book-grid">{continueBooks.map(b => <BookCard key={b.id} book={b} />)}</div>
          : <Empty icon="headphones" title="لم تبدأ الاستماع بعد" text="ابدأ أيّ ملخّص وسيظهر هنا لتُكمله متى شئت." cta="استكشف الملخّصات" onCta={() => navigate('browse')} />
      ) : (
        favBooks.length ? <div className="book-grid">{favBooks.map(b => <BookCard key={b.id} book={b} />)}</div>
          : <Empty icon="heart" title="لا مفضّلات بعد" text="اضغط القلب على أيّ ملخّص ليُحفظ هنا." cta="تصفّح المكتبة" onCta={() => navigate('browse')} />
      )}
    </div>
  );
}

export function Categories() {
  const { navigate } = useApp();
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-head">
        <h1 className="page-title">التصنيفات</h1>
        <p className="page-sub">تسعة مجالات معرفية — اختر شغفك وابدأ الرحلة.</p>
      </div>
      <div className="cat-grid">
        {CATEGORIES.map(c => {
          const sample = booksByCat(c.id)[0];
          return (
            <div key={c.id} className="cat-tile" onClick={() => navigate('category', { id: c.id })}
              style={{ '--cv-bg': sample.palette.bg, '--cv-bg2': sample.palette.bg2, '--cv-accent': sample.palette.accent }}>
              <div className="cat-tile-pattern"></div>
              <div className="cat-tile-body">
                <div className="cat-tile-count tnum">{catCount(c.id)} ملخّص</div>
                <h3>{c.name}</h3>
                <p>{c.blurb}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Category() {
  const { route, navigate } = useApp();
  const cat = catById(route.params.id) || CATEGORIES[0];
  const books = booksByCat(cat.id);
  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <button className="back-link" onClick={() => navigate('categories')}><Icon name="chevR" size={18} /> كل التصنيفات</button>
      <div className="cat-header">
        <span className="eyebrow">تصنيف</span>
        <h1 className="page-title">{cat.name}</h1>
        <p className="page-sub">{cat.blurb}</p>
        <div className="meta-row" style={{ marginTop: 10 }}><span className="mi tnum"><Icon name="layers" /> {books.length} ملخّص</span></div>
      </div>
      <div className="book-grid" style={{ marginTop: 32 }}>{books.map(b => <BookCard key={b.id} book={b} />)}</div>
    </div>
  );
}

export function About() {
  const { navigate } = useApp();
  return (
    <div className="container container-narrow" style={{ paddingTop: 24 }}>
      <div className="editorial">
        <span className="eyebrow center">من نحن</span>
        <h1 className="editorial-title">المعرفة حقٌّ للجميع، والوقت لا ينتظر أحداً.</h1>
        <p className="editorial-lead">الموسوعة الذكية منصّة عربية تُحوّل أهمّ الكتب إلى خلاصاتٍ مسموعة ومقروءة، تصل إليك أينما كنت — في طريقك، في تمرينك، أو في لحظة هدوء قبل النوم.</p>
        <hr className="hairline" style={{ margin: '36px 0' }} />
        <div className="editorial-cols">
          <div>
            <h3 className="gold-h">ما «الخلاصة» عندنا؟</h3>
            <p>ليست اختصاراً يُغنيك عن الكتاب، بل بوّابةٌ إليه. نلتقط الأفكار الجوهرية ونقدّمها بصوتٍ واضح ونصٍّ مُتقن، لتقرّر بنفسك أيّ الكتب يستحقّ رحلةً كاملة.</p>
          </div>
          <div>
            <h3 className="gold-h">لمن نصنع هذا؟</h3>
            <p>لكلّ فضوليّ لا يجد وقتاً كافياً؛ للطالب، والمهنيّ، والأمّ، والباحث عن المعنى. لكلّ من يؤمن أن خمس عشرة دقيقة واعية قد تغيّر زاوية نظره للعالم.</p>
          </div>
        </div>
        <div className="value-stats">
          {[['16', 'خلاصة منشورة'], ['9', 'مجالات معرفية'], ['100%', 'عربيّ، صوتاً ونصّاً']].map(([n, l]) => (
            <div key={l} className="vstat"><div className="vstat-n display tnum">{n}</div><div className="vstat-l">{l}</div></div>
          ))}
        </div>
        <hr className="hairline" style={{ margin: '36px 0' }} />
        <blockquote className="pullquote">«نحن لا نبيع اختصاراً للوقت، بل نُشعل شغفاً بالمعرفة.»</blockquote>
        <div className="center" style={{ marginTop: 32 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('browse')}>ابدأ الاستماع</button>
        </div>
      </div>
    </div>
  );
}

export function Publisher() {
  const { navigate } = useApp();
  const o = OWNER;
  const humain = bookById('humain');
  return (
    <div className="container container-narrow" style={{ paddingTop: 24 }}>
      <div className="pub-hero">
        <div className="pub-portrait">
          <div className="portrait-ph"><Icon name="user" size={56} /></div>
          <span className="portrait-mark display">ح</span>
        </div>
        <div>
          <span className="eyebrow">عن الناشر</span>
          <h1 className="pub-name">{o.name}</h1>
          <div className="pub-role">{o.role}</div>
          <div className="pub-title">{o.titleLine}</div>
          <div className="meta-row" style={{ marginTop: 12 }}><span className="mi"><Icon name="pin" /> {o.location}</span></div>
          <div className="social-row pub-social">
            <a aria-label="لينكدإن"><Icon name="linkedin" size={18} /></a>
            <a aria-label="تويتر"><Icon name="twitter" size={18} /></a>
          </div>
        </div>
      </div>
      <hr className="hairline" style={{ margin: '36px 0' }} />
      <div className="pub-stats">
        {o.stats.map(s => <div key={s.l} className="vstat"><div className="vstat-n display tnum">{s.n}</div><div className="vstat-l">{s.l}</div></div>)}
      </div>
      <div className="pub-bio">
        {o.bio.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <blockquote className="pullquote" style={{ marginTop: 12 }}>«{o.philosophy}»</blockquote>
      {humain && (
        <div className="pub-book card">
          <div className="cover-wrap" style={{ width: 84, flex: 'none' }}><Cover book={humain} /></div>
          <div>
            <span className="eyebrow">من تأليفه — متاح كخلاصة</span>
            <h3 style={{ fontSize: 20, margin: '6px 0' }}>صناعة إنسانٍ ذكيّ</h3>
            <p className="muted" style={{ fontSize: 14.5 }}>{humain.teaser}</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('detail', { id: 'humain' })}>استمع للخلاصة <Icon name="chevL" size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Contact() {
  const { pushToast } = useApp();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', body: '' });
  const submit = (e) => { e.preventDefault(); setSent(true); pushToast('تم إرسال رسالتك، شكراً لك'); };
  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="container container-narrow" style={{ paddingTop: 24 }}>
      <div className="page-head center">
        <span className="eyebrow">اتصل بنا</span>
        <h1 className="page-title">يسعدنا أن نسمع منك</h1>
        <p className="page-sub" style={{ margin: '8px auto 0' }}>اقتراح كتاب، ملاحظة، أو فرصة تعاون — صندوقنا مفتوح دائماً.</p>
      </div>
      <div className="contact-grid">
        <form className="card contact-form" onSubmit={submit}>
          {sent ? (
            <div className="contact-success">
              <div className="e-ico" style={{ color: 'var(--jade)' }}><Icon name="checkCircle" size={40} /></div>
              <h3>تم إرسال رسالتك، شكراً لك</h3>
              <p className="muted">سنردّ عليك في أقرب وقت ممكن.</p>
              <button type="button" className="btn btn-secondary" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', body: '' }); }}>إرسال رسالة أخرى</button>
            </div>
          ) : (
            <>
              <Field label="الاسم"><input value={form.name} onChange={upd('name')} required placeholder="اسمك الكريم" /></Field>
              <Field label="البريد الإلكتروني"><input type="email" value={form.email} onChange={upd('email')} required placeholder="you@example.com" dir="ltr" style={{ textAlign: 'right' }} /></Field>
              <Field label="الموضوع"><input value={form.subject} onChange={upd('subject')} required placeholder="بماذا يمكننا مساعدتك؟" /></Field>
              <Field label="الرسالة"><textarea rows="5" value={form.body} onChange={upd('body')} required placeholder="اكتب رسالتك هنا…"></textarea></Field>
              <button className="btn btn-primary btn-block btn-lg" type="submit"><Icon name="mail" size={18} /> إرسال</button>
            </>
          )}
        </form>
        <aside className="contact-info">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>تواصل مباشر</h3>
          <a className="contact-line"><span className="ci-ic"><Icon name="mail" size={18} /></span><span><b>البريد</b><br />hello@smart-encyclopedia.ar</span></a>
          <a className="contact-line"><span className="ci-ic"><Icon name="phone" size={18} /></span><span><b>الهاتف</b><br /><span dir="ltr">+971 56 522 3700</span></span></a>
          <a className="contact-line"><span className="ci-ic"><Icon name="pin" size={18} /></span><span><b>المقر</b><br />دبي، الإمارات العربية المتحدة</span></a>
          <div className="social-row" style={{ marginTop: 22 }}>
            <a aria-label="تويتر"><Icon name="twitter" size={18} /></a>
            <a aria-label="لينكدإن"><Icon name="linkedin" size={18} /></a>
            <a aria-label="إنستغرام"><Icon name="instagram" size={18} /></a>
            <a aria-label="يوتيوب"><Icon name="youtube" size={18} /></a>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function More() {
  const { navigate } = useApp();
  const links = [
    { v: 'categories', l: 'التصنيفات', ic: 'layers' },
    { v: 'about', l: 'من نحن', ic: 'sparkle' },
    { v: 'publisher', l: 'عن الناشر', ic: 'user' },
    { v: 'contact', l: 'اتصل بنا', ic: 'mail' },
    { v: 'owner-login', l: 'دخول الناشر', ic: 'lock' },
  ];
  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="page-head"><h1 className="page-title">المزيد</h1></div>
      <div className="more-list card">
        {links.map(l => (
          <button key={l.v} className="more-row" onClick={() => navigate(l.v)}>
            <span className="more-ic"><Icon name={l.ic} size={20} /></span>
            <span className="grow" style={{ textAlign: 'start' }}>{l.l}</span>
            <Icon name="chevL" size={18} className="faint" />
          </button>
        ))}
      </div>
      <div className="row-between" style={{ marginTop: 24, padding: '0 4px' }}>
        <span className="muted" style={{ fontSize: 14 }}>الوضع</span>
        <ThemeToggle />
      </div>
    </div>
  );
}
