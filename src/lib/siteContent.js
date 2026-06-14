/* siteContent.js — editable page copy (CMS-style).
 *
 * DEFAULT_CONTENT holds the shipped copy; the ContentProvider deep-merges any
 * admin overrides on top (so new keys added here still appear for existing
 * users). CONTENT_SCHEMA drives the admin "محتوى الصفحات" screen (grouping,
 * labels, multiline). Components read content[page][key]; they never hardcode
 * editable copy. Maps later to a Supabase `site_content` jsonb row.
 */
export const DEFAULT_CONTENT = {
  brand: {
    tagline: 'استمع · اقرأ · تعلّم',
    footerBlurb: 'خلاصة المعرفة بين يديك — استمع للكتاب أو اقرأه، أينما كنت. منصّة عربية تجعل التعلّم عادةً يومية.',
    footerCopyright: '© 2026 الموسوعة الذكية — جميع الحقوق محفوظة.',
    footerMade: 'صُنع بشغف للمعرفة العربية',
  },
  home: {
    heroEyebrow: 'ملخّص مميّز',
    heroFoot: 'ملخّص الأسبوع',
    secContinue: 'تابِع الاستماع',
    secCategories: 'تصفّح حسب التصنيف',
    secNewest: 'أحدث الملخّصات',
    secMost: 'الأكثر استماعاً',
    secAll: 'المكتبة الكاملة',
    /* Phase 3: ordered, show/hide-able home sections (edited via on-page drag). */
    layout: [
      { id: 'continue', visible: true },
      { id: 'categories', visible: true },
      { id: 'newest', visible: true },
      { id: 'most', visible: true },
      { id: 'all', visible: true },
    ],
  },
  browse: {
    title: 'استكشاف',
    subtitle: 'ابحث في العناوين والمؤلّفين والوسوم — وحتّى داخل نصوص الملخّصات نفسها.',
  },
  library: {
    title: 'مكتبتي',
    subtitle: 'محفوظة على هذا الجهاز — لا حاجة لتسجيل الدخول.',
  },
  categories: {
    title: 'التصنيفات',
    subtitle: 'تسعة مجالات معرفية — اختر شغفك وابدأ الرحلة.',
  },
  about: {
    eyebrow: 'من نحن',
    title: 'المعرفة حقٌّ للجميع، والوقت لا ينتظر أحداً.',
    lead: 'الموسوعة الذكية منصّة عربية تُحوّل أهمّ الكتب إلى خلاصاتٍ مسموعة ومقروءة، تصل إليك أينما كنت — في طريقك، في تمرينك، أو في لحظة هدوء قبل النوم.',
    col1Title: 'ما «الخلاصة» عندنا؟',
    col1Body: 'ليست اختصاراً يُغنيك عن الكتاب، بل بوّابةٌ إليه. نلتقط الأفكار الجوهرية ونقدّمها بصوتٍ واضح ونصٍّ مُتقن، لتقرّر بنفسك أيّ الكتب يستحقّ رحلةً كاملة.',
    col2Title: 'لمن نصنع هذا؟',
    col2Body: 'لكلّ فضوليّ لا يجد وقتاً كافياً؛ للطالب، والمهنيّ، والأمّ، والباحث عن المعنى. لكلّ من يؤمن أن خمس عشرة دقيقة واعية قد تغيّر زاوية نظره للعالم.',
    stat1Label: 'خلاصة منشورة',
    stat2Label: 'مجالات معرفية',
    stat3Value: '100%',
    stat3Label: 'عربيّ، صوتاً ونصّاً',
    pullQuote: 'نحن لا نبيع اختصاراً للوقت، بل نُشعل شغفاً بالمعرفة.',
    cta: 'ابدأ الاستماع',
  },
  contact: {
    eyebrow: 'اتصل بنا',
    title: 'يسعدنا أن نسمع منك',
    subtitle: 'اقتراح كتاب، ملاحظة، أو فرصة تعاون — صندوقنا مفتوح دائماً.',
  },
};

export const CONTENT_SCHEMA = [
  { page: 'brand', label: 'الهوية والتذييل', fields: [
    { key: 'tagline', label: 'الشعار الفرعي (الترويسة)' },
    { key: 'footerBlurb', label: 'نبذة التذييل', multiline: true },
    { key: 'footerCopyright', label: 'حقوق النشر' },
    { key: 'footerMade', label: 'سطر «صُنع بـ…»' },
  ] },
  { page: 'home', label: 'الصفحة الرئيسية', fields: [
    { key: 'heroEyebrow', label: 'شارة البطل' },
    { key: 'heroFoot', label: 'تسمية غلاف البطل' },
    { key: 'secContinue', label: 'عنوان قسم: تابِع الاستماع' },
    { key: 'secCategories', label: 'عنوان قسم: التصنيفات' },
    { key: 'secNewest', label: 'عنوان قسم: الأحدث' },
    { key: 'secMost', label: 'عنوان قسم: الأكثر استماعاً' },
    { key: 'secAll', label: 'عنوان قسم: المكتبة الكاملة' },
  ] },
  { page: 'browse', label: 'الاستكشاف', fields: [
    { key: 'title', label: 'العنوان' },
    { key: 'subtitle', label: 'الوصف', multiline: true },
  ] },
  { page: 'library', label: 'مكتبتي', fields: [
    { key: 'title', label: 'العنوان' },
    { key: 'subtitle', label: 'الوصف', multiline: true },
  ] },
  { page: 'categories', label: 'التصنيفات', fields: [
    { key: 'title', label: 'العنوان' },
    { key: 'subtitle', label: 'الوصف', multiline: true },
  ] },
  { page: 'about', label: 'من نحن', fields: [
    { key: 'eyebrow', label: 'الشارة' },
    { key: 'title', label: 'العنوان الرئيسي', multiline: true },
    { key: 'lead', label: 'المقدّمة', multiline: true },
    { key: 'col1Title', label: 'عنوان العمود الأول' },
    { key: 'col1Body', label: 'نص العمود الأول', multiline: true },
    { key: 'col2Title', label: 'عنوان العمود الثاني' },
    { key: 'col2Body', label: 'نص العمود الثاني', multiline: true },
    { key: 'stat1Label', label: 'تسمية الإحصاء الأول' },
    { key: 'stat2Label', label: 'تسمية الإحصاء الثاني' },
    { key: 'stat3Value', label: 'قيمة الإحصاء الثالث' },
    { key: 'stat3Label', label: 'تسمية الإحصاء الثالث' },
    { key: 'pullQuote', label: 'الاقتباس', multiline: true },
    { key: 'cta', label: 'نص زر الإجراء' },
  ] },
  { page: 'contact', label: 'اتصل بنا', fields: [
    { key: 'eyebrow', label: 'الشارة' },
    { key: 'title', label: 'العنوان' },
    { key: 'subtitle', label: 'الوصف', multiline: true },
  ] },
];
