/* ==========================================================================
   S&J Fitness — i18n.js (prototype only)
   Shows the preview in ES, EN, PT, FR or DE. The page is written in English;
   every visible text, placeholder, label and alt is swapped from the table in
   i18n-data.js, including text that scripts add later (bag, filters, sizes).
   In Shopify the same texts come from the locale files and Translate & Adapt.
   Not translated on purpose: brand and category names, product references,
   carriers.
   ========================================================================== */

(() => {
  const DATA = window.SJ_I18N;
  if (!DATA) return;

  const LANGS = ['es', 'pt', 'fr', 'de'];
  const IDX = { es: 0, pt: 1, fr: 2, de: 3 };
  // Review labels (.pending, placeholders) are translated too: they stay marked as pending.
  const SKIP = 'script, style, svg, [data-guide-panel], [data-no-i18n]';
  const ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];

  const textSource = new WeakMap(); // text node -> English original
  const written = new WeakMap();    // text node -> last value set here
  const attrSource = new WeakMap(); // element -> { attr: original }
  let lang = 'en';
  let busy = false;

  // Text whose wording follows a pattern (numbers, references, generated lines).
  const PATTERNS = [
    [/^Showing (\d+) of (\d+)$/, ['Mostrando $1 de $2', 'A mostrar $1 de $2', '$1 sur $2', '$1 von $2']],
    [/^(Posing Trunk|Classic Physique Trunk|Competition Bikini) (SJ-M\d{3})$/, (m, l) => `${({
      'Posing Trunk': ['Bañador de posing', 'Sunga de posing', 'Slip de posing', 'Posinghose'],
      'Classic Physique Trunk': ['Bañador Classic Physique', 'Sunga Classic Physique', 'Slip Classic Physique', 'Classic-Physique-Posinghose'],
      'Competition Bikini': ['Bikini de competición', 'Biquíni de competição', 'Bikini de compétition', 'Wettkampfbikini'],
    })[m[1]][IDX[l]]} ${m[2]}`],
    [/^Pack (\d) posings \(−(.+)\)$/, ['Pack $1 posings (−$2)', 'Pack $1 posings (−$2)', 'Pack $1 posings (−$2)', 'Paket $1 Posings (−$2)']],
    [/^Pack (\d) posings · (\d+) Bodybuilding posings$/, ['Pack $1 posings · $2 posings de Bodybuilding', 'Pack $1 posings · $2 posings de Bodybuilding', 'Pack $1 posings · $2 posings Bodybuilding', 'Paket $1 Posings · $2 Bodybuilding-Posings']],
    [/^(.+) each$/, ['$1 / unidad', '$1 / unidade', '$1 l’unité', '$1 pro Stück']],
    [/^(·\s)?Posing (\d)$/, ['$1Posing $2', '$1Posing $2', '$1Posing $2', '$1Posing $2']],
    [/^Posing (\d) · Waist:$/, ['Posing $1 · Cintura:', 'Posing $1 · Cintura:', 'Posing $1 · Tour de taille :', 'Posing $1 · Taille:']],
    [/^Posing (\d) · Waist unit:$/, ['Posing $1 · Unidad:', 'Posing $1 · Unidade:', 'Posing $1 · Unité :', 'Posing $1 · Einheit:']],
    [/^Posing (\d) · Waist equivalent:$/, ['Posing $1 · Equivalencia:', 'Posing $1 · Equivalência:', 'Posing $1 · Équivalence :', 'Posing $1 · Umrechnung:']],
    [/^(\d) posings: the pack of (\d) costs (.+)\.$/, ['$1 posings: el pack de $2 cuesta $3.', '$1 posings: o pack de $2 custa $3.', '$1 posings : le pack de $2 coûte $3.', '$1 Posings: Das Paket mit $2 kostet $3.']],
    [/^(\d+)″ — cm pending confirmation$/, ['$1″ — cm pendiente de confirmar', '$1″ — cm a confirmar', '$1″ — cm à confirmer', '$1″ — cm wird bestätigt']],
    [/^(\d+)″ — (.+ cm)$/, ['$1″ — $2', '$1″ — $2', '$1″ — $2', '$1″ — $2']],
  ];

  // Photo alts are written in Spanish: rebuilt for every language, English included.
  const ALT = /^(Bañador de culturismo|Bikini de competición|Slip de Classic Physique) a medida S&J Fitness(?:, (.+?))?, vista (principal|\d+)$/;
  const ALT_WORDS = {
    en: { 'Bañador de culturismo': 'Made-to-measure Bodybuilding posing trunk', 'Bikini de competición': 'Made-to-measure competition bikini', 'Slip de Classic Physique': 'Made-to-measure Classic Physique trunk', main: 'main view', view: 'view' },
    pt: { 'Bañador de culturismo': 'Sunga de posing de Bodybuilding por medida', 'Bikini de competición': 'Biquíni de competição por medida', 'Slip de Classic Physique': 'Sunga Classic Physique por medida', main: 'vista principal', view: 'vista' },
    fr: { 'Bañador de culturismo': 'Slip de posing Bodybuilding sur mesure', 'Bikini de competición': 'Bikini de compétition sur mesure', 'Slip de Classic Physique': 'Slip Classic Physique sur mesure', main: 'vue principale', view: 'vue' },
    de: { 'Bañador de culturismo': 'Bodybuilding-Posinghose nach Maß', 'Bikini de competición': 'Wettkampfbikini nach Maß', 'Slip de Classic Physique': 'Classic-Physique-Posinghose nach Maß', main: 'Hauptansicht', view: 'Ansicht' },
  };
  const COLOUR_IDX = { en: 0, pt: 1, fr: 2, de: 3 };

  const translateAlt = (text) => {
    const m = text.match(ALT);
    if (!m) return translate(text); // alt written in English, from the table
    if (lang === 'es') return text;
    const w = ALT_WORDS[lang];
    const colour = m[2] ? (DATA.altColours[m[2]] || [m[2], m[2], m[2], m[2]])[COLOUR_IDX[lang]] : '';
    const view = m[3] === 'principal' ? w.main : `${w.view} ${m[3]}`;
    return `${w[m[1]]} S&J Fitness${colour ? `, ${colour}` : ''}, ${view}`;
  };

  const translate = (english) => {
    if (lang === 'en') return english;
    const table = DATA.strings[lang];
    if (table[english]) return table[english];
    for (const [re, to] of PATTERNS) {
      const m = english.match(re);
      if (m) return typeof to === 'function' ? to(m, lang) : english.replace(re, to[IDX[lang]]);
    }
    // Title of the page: "Part — Part".
    if (english.includes(' — ')) {
      return english.split(' — ').map(translate).join(' — ');
    }
    return english;
  };

  const swap = (node) => {
    if (!textSource.has(node)) textSource.set(node, node.nodeValue);
    const source = textSource.get(node);
    const core = source.replace(/\s+/g, ' ').trim();
    if (!core) return;
    // An element can name its own key (data-i18n) when its English text is also a
    // name kept elsewhere (e.g. the «Bodybuilding» tab, «Culturismo» in Spanish).
    const keyed = node.parentElement && node.parentElement.dataset.i18n;
    const out = keyed && lang !== 'en' ? (DATA.strings[lang][keyed] || core) : translate(core);
    const lead = source.match(/^\s*/)[0];
    const tail = source.match(/\s*$/)[0];
    const next = out === core ? source : `${lead}${out}${tail}`;
    if (node.nodeValue !== next) { node.nodeValue = next; written.set(node, next); }
  };

  const swapAttrs = (el) => {
    let store = attrSource.get(el);
    ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      if (!store) { store = {}; attrSource.set(el, store); }
      if (!(a in store)) store[a] = el.getAttribute(a);
      const source = store[a];
      const next = a === 'alt' ? translateAlt(source) : translate(source.trim());
      if (el.getAttribute(a) !== next) el.setAttribute(a, next);
    });
  };

  const walk = (root) => {
    if (root.nodeType === Node.TEXT_NODE) {
      if (!root.parentElement || !root.parentElement.closest(SKIP)) swap(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(SKIP)) return;
    swapAttrs(root);
    root.querySelectorAll('*').forEach((el) => { if (!el.closest(SKIP)) swapAttrs(el); });
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = it.nextNode(); n; n = it.nextNode()) swap(n);
  };

  const meta = document.querySelector('meta[name="description"]');
  const sources = { title: document.title, meta: meta && meta.content };

  const apply = (code) => {
    lang = LANGS.includes(code) ? code : 'en';
    busy = true;
    document.documentElement.lang = lang;
    document.title = translate(sources.title);
    if (meta) meta.content = translate(sources.meta);
    walk(document.body);
    busy = false;
  };

  // Text that scripts add or replace later: translate it as it arrives.
  new MutationObserver((records) => {
    if (busy) return;
    busy = true;
    records.forEach((r) => {
      if (r.type === 'characterData') {
        if (written.get(r.target) === r.target.nodeValue) return; // our own change
        textSource.set(r.target, r.target.nodeValue);
        if (!r.target.parentElement || !r.target.parentElement.closest(SKIP)) swap(r.target);
      } else {
        r.addedNodes.forEach(walk);
      }
    });
    busy = false;
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  // English original of an element's text, for scripts that store it.
  window.SJi18n = {
    source: (el) => {
      const it = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let s = '';
      for (let n = it.nextNode(); n; n = it.nextNode()) s += textSource.get(n) ?? n.nodeValue;
      return s;
    },
  };

  document.addEventListener('sj:lang', (e) => apply(e.detail));
  apply(document.documentElement.dataset.lang || 'en');
})();
