/* ==========================================================================
   S&J Fitness — theme.js
   Vanilla JS, no dependencies. Every behaviour is progressive: the page
   works without it (native <details>, visible content).
   Shopify: assets/theme.js, loaded with defer from layout/theme.liquid.
   ========================================================================== */

(() => {
  // iOS Safari only applies :active when a touch listener exists.
  document.addEventListener('touchstart', () => {}, { passive: true });

  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const drawer = document.querySelector('[data-drawer]');
  const dropdowns = document.querySelectorAll('[data-dropdown]');

  /* ---------- Header: transparent over hero, hide on scroll down ---------- */
  if (header) {
    const isOverlay = header.hasAttribute('data-overlay');
    let lastY = window.scrollY;
    let ticking = false;

    const anyMenuOpen = () =>
      (drawer && drawer.open) || [...dropdowns].some((d) => d.open);

    const update = () => {
      const y = window.scrollY;
      header.dataset.state = isOverlay && y < 40 && !anyMenuOpen() ? 'top' : 'solid';
      header.classList.toggle('is-hidden', y > lastY && y > 480 && !anyMenuOpen());
      lastY = y;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    header.addEventListener('toggle', update, true);
    update();
  }

  /* ---------- Mobile drawer ---------- */
  if (drawer) {
    drawer.addEventListener('toggle', () => {
      root.classList.toggle('has-drawer', drawer.open);
    });
    drawer.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => { drawer.open = false; })
    );
  }

  /* ---------- Desktop dropdown: one open at a time, close outside ---------- */
  dropdowns.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) dropdowns.forEach((o) => { if (o !== d) o.open = false; });
    });
    d.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => { d.open = false; })
    );
  });

  document.addEventListener('click', (e) => {
    dropdowns.forEach((d) => { if (d.open && !d.contains(e.target)) d.open = false; });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    [drawer, ...dropdowns].forEach((d) => {
      if (d && d.open) { d.open = false; d.querySelector('summary').focus(); }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Prototype-only forms (not connected) ---------- */
  document.querySelectorAll('form[data-prototype]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = form.querySelector('[data-form-status]');
      if (status) status.textContent = 'Prototype — nothing was sent. This form will be connected in Shopify.';
    });
  });

  /* ---------- Prototype-only language selector ----------
     Stays on the current page and remembers the choice. Texts are English only
     here; in Shopify the localization form switches to the translated page. */
  const lang = document.querySelector('[data-lang]');
  if (lang) {
    const options = lang.querySelectorAll('[data-lang-option]');
    const select = (code) => {
      const option = lang.querySelector(`[data-lang-option="${code}"]`);
      if (!option) return;
      options.forEach((o) => o.removeAttribute('aria-current'));
      option.setAttribute('aria-current', 'true');
      lang.querySelector('[data-lang-flag]').textContent = option.querySelector('.lang__flag').textContent;
      lang.querySelector('[data-lang-code]').textContent = code.toUpperCase();
      document.documentElement.dataset.lang = code;
      document.dispatchEvent(new CustomEvent('sj:lang', { detail: code }));
      // «Home» and the logo go back to the home page in the chosen language.
      document.querySelectorAll('a[data-home]').forEach((link) => {
        link.setAttribute('href', `index.html?lang=${code}`);
      });
    };
    let saved = new URLSearchParams(location.search).get('lang');
    try { saved = saved || localStorage.getItem('sj-lang'); } catch (e) { /* storage blocked */ }
    if (saved) {
      select(saved);
      // A link that arrives with ?lang= also keeps that language while browsing.
      try { localStorage.setItem('sj-lang', saved); } catch (e) { /* storage blocked */ }
    }
    options.forEach((o) => o.addEventListener('click', (e) => {
      e.preventDefault();
      const code = o.dataset.langOption;
      select(code);
      try { localStorage.setItem('sj-lang', code); } catch (err) { /* storage blocked */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', code);
      history.replaceState(null, '', url);
      lang.open = false;
    }));
  }

  /* ---------- Prototype bag (stands in for the Shopify cart) ----------
     Stored in this browser only. In Shopify the bag is the native cart. */
  const BAG_KEY = 'sj-bag';
  const bag = {
    read() {
      try { return JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch (e) { return []; }
    },
    write(items) {
      try { localStorage.setItem(BAG_KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ }
      bag.count();
    },
    add(item) {
      const items = bag.read();
      items.push({ ...item, key: `${item.model}-${Date.now()}`, qty: 1 });
      bag.write(items);
    },
    count() {
      const n = bag.read().reduce((sum, i) => sum + i.qty, 0);
      document.querySelectorAll('[data-bag-count]').forEach((el) => { el.textContent = `(${n})`; });
    },
  };
  window.SJBag = bag;
  bag.count();

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
