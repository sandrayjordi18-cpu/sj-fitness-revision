/* ==========================================================================
   S&J Fitness — limited-series.js
   Tabs (Men's Physique / Bodybuilding) and the next-series sign-up.
   Shopify: the form is {% form 'customer' %}; it is validated here and then
   submitted to Shopify, which alone confirms the sign-up.
   Prototype (data-prototype-signup): nothing is sent; it says so.
   ========================================================================== */

(() => {
  const root = document.querySelector('[data-ls]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[data-ls-tab]')];
  const form = root.querySelector('[data-ls-signup]');
  const tagsInput = form && form.querySelector('[data-ls-tags]');
  const status = form && form.querySelector('[data-ls-status]');

  const show = (key) => {
    tabs.forEach((tab) => {
      const on = tab.dataset.lsTab === key;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-ls-panel], [data-ls-media], [data-ls-consent], [data-ls-step]').forEach((el) => {
      const own = el.dataset.lsPanel || el.dataset.lsMedia || el.dataset.lsConsent || el.dataset.lsStep;
      el.hidden = own !== key;
    });
    // The interest travels with the sign-up as a customer tag.
    const tab = tabs.find((t) => t.dataset.lsTab === key);
    if (tagsInput && tab) {
      const base = tagsInput.dataset.base.split(',').filter(Boolean);
      // In Shopify the language tag comes in data-base; the prototype adds the one on screen.
      if (!base.some((t) => t.startsWith('idioma-'))) base.push(`idioma-${document.documentElement.lang}`);
      tagsInput.value = [...base, tab.dataset.interest].join(',');
    }
    if (status) status.hidden = true;
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(tab.dataset.lsTab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      show(next.dataset.lsTab);
    });
  });
  const start = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
  if (start) show(start.dataset.lsTab);
  document.addEventListener('sj:lang', () => {
    const current = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (current) show(current.dataset.lsTab);
  });

  if (!form) return;
  const email = form.querySelector('input[type="email"]');
  const consent = form.querySelector('[data-ls-consent-box]');
  const say = (text, error) => {
    status.textContent = text;
    status.classList.toggle('is-error', Boolean(error));
    status.hidden = false;
  };

  form.addEventListener('submit', (e) => {
    email.setAttribute('aria-invalid', 'false');
    if (!email.value.trim() || !email.checkValidity()) {
      e.preventDefault();
      email.setAttribute('aria-invalid', 'true');
      email.focus();
      say(form.dataset.msgEmail || 'Enter a valid email address.', true);
      return;
    }
    if (!consent.checked) {
      e.preventDefault();
      consent.focus();
      say(form.dataset.msgConsent || 'Tick the box to confirm you want to receive our emails.', true);
      return;
    }
    if (form.hasAttribute('data-prototype-signup')) {
      e.preventDefault();
      say('Sign-up is not connected in this preview: nothing has been sent or saved.', true);
    }
    // Shopify: the form submits; the page reloads with Shopify's own result.
  });
})();
