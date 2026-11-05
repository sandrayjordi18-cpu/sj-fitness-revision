/* ==========================================================================
   S&J Fitness — product.js
   Gallery counter, option labels, mobile sticky bar, prototype submit.
   Vanilla, progressive. Shopify: assets/product.js, loaded by main-product.
   ========================================================================== */

(() => {
  const form = document.querySelector('[data-product-form]');
  if (!form) return;

  /* ---------- Gallery counter (mobile swipe) ---------- */
  const gallery = document.querySelector('[data-gallery]');
  const current = document.querySelector('[data-gallery-current]');
  if (gallery && current && 'IntersectionObserver' in window) {
    const items = [...gallery.children];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) current.textContent = items.indexOf(entry.target) + 1;
      });
    }, { root: gallery, threshold: 0.6 });
    items.forEach((item) => io.observe(item));
  }

  /* ---------- Sticky info column taller than the viewport ----------
     Sticks to the bottom edge instead of hiding its lower half. */
  const info = document.querySelector('.product__info-inner');
  if (info) {
    const setTop = () => {
      const headerOffset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) + 32;
      const overflow = window.innerHeight - info.offsetHeight - 32;
      info.style.top = `${Math.min(headerOffset, overflow)}px`;
    };
    setTop();
    window.addEventListener('resize', setTop);
    info.addEventListener('toggle', setTop, true);
  }

  /* ---------- Selected option labels ---------- */
  const stickyVariant = document.querySelector('[data-sticky-variant]');

  const selectedVariant = () =>
    [...form.querySelectorAll('[data-option] input:checked')].map((i) => i.value).join(' · ');

  form.querySelectorAll('[data-option]').forEach((fieldset) => {
    const label = fieldset.querySelector('[data-option-value]');
    fieldset.addEventListener('change', (e) => {
      if (label) label.textContent = e.target.value;
      if (stickyVariant) stickyVariant.textContent = selectedVariant();
    });
  });

  /* ---------- Colour shows its own photo ----------
     Only colours documented for this model are offered; each points at the
     gallery image photographed in that colour. */
  form.querySelectorAll('[data-colour-option] input[data-media-index]').forEach((input) => {
    input.addEventListener('change', () => {
      const item = gallery && gallery.children[Number(input.dataset.mediaIndex)];
      if (item) item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
  });

  const status = form.querySelector('[data-form-status]');

  /* ---------- Waist: exact value in cm or in (1 in = 2.54 cm) ----------
     The value is kept exactly as typed, in the unit it was typed in.
     Switching unit only shows the conversion; switching back restores it.
     A pack has one waist field per posing. */
  const lang = () => document.documentElement.dataset.lang || 'en';
  const fmt = (n) => new Intl.NumberFormat(lang(), { maximumFractionDigits: 2 }).format(n);
  const convert = (v, from) => (from === 'cm' ? v / 2.54 : v * 2.54);
  const other = (u) => (u === 'cm' ? 'in' : 'cm');

  const initWaist = (waist) => {
    const input = waist.querySelector('[data-waist-input]');
    const equiv = waist.querySelector('[data-waist-equiv]');
    const record = (k) => waist.querySelector(`[data-waist-record="${k}"]`);
    const emptyText = equiv.textContent;
    let source = null; // { raw, unit }
    const unitNow = () => waist.querySelector('[data-waist-unit]:checked').value;

    const render = () => {
      const v = source && parseFloat(source.raw);
      if (!source || !(v > 0)) {
        equiv.textContent = emptyText;
        ['value', 'unit', 'equivalent'].forEach((k) => { record(k).value = ''; });
        return;
      }
      const c = convert(v, source.unit);
      equiv.innerHTML = `<strong>${fmt(v)} ${source.unit}</strong> = ${fmt(c)} ${other(source.unit)}`;
      record('value').value = `${source.raw} ${source.unit}`;
      record('unit').value = source.unit;
      record('equivalent').value = `${c.toFixed(2)} ${other(source.unit)} (1 in = 2.54 cm)`;
    };

    input.addEventListener('input', () => {
      source = input.value === '' ? null : { raw: input.value, unit: unitNow() };
      render();
    });
    waist.querySelectorAll('[data-waist-unit]').forEach((r) => r.addEventListener('change', () => {
      if (source) {
        const v = parseFloat(source.raw);
        input.value = r.value === source.unit ? source.raw : (v > 0 ? convert(v, source.unit).toFixed(2) : '');
      }
      input.placeholder = r.value === 'cm' ? '81.5' : '32';
    }));
    document.addEventListener('sj:lang', render);
    return { record, values: () => ['value', 'unit', 'equivalent'].map((k) => record(k).value) };
  };

  const waists = [...form.querySelectorAll('[data-waist]')].map(initWaist);
  let waistRecord = () => {
    const w = waists[0];
    return w && w.record('value').value ? ` Waist: ${w.record('value').value} (≈ ${w.record('equivalent').value}).` : '';
  };

  /* ---------- Pack: choose each posing, its colour comes with the design ---------- */
  const pack = form.querySelector('[data-pack]');
  const picker = document.querySelector('[data-pack-picker]');
  if (pack && picker && window.SJ_PACK_DESIGNS) {
    const slots = [...pack.querySelectorAll('[data-pack-slot]')];
    const submit = form.querySelector('[data-pack-submit]');
    const same = pack.querySelector('[data-pack-same]');
    const grid = picker.querySelector('[data-picker-grid]');
    // A category with no designs yet shows no tab.
    const tabs = [...picker.querySelectorAll('[data-picker-cat]')].filter((t) => {
      const has = window.SJ_PACK_DESIGNS.some((d) => d.cat === t.dataset.pickerCat);
      if (!has) t.remove();
      return has;
    });
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    let activeSlot = null;
    let activeCat = 'Bodybuilding';

    const showCat = (cat) => {
      activeCat = cat;
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.pickerCat === cat)));
      grid.innerHTML = window.SJ_PACK_DESIGNS.filter((d) => d.cat === cat).map((d) => `<li>
        <button class="pack-picker__item" type="button" data-design="${esc(d.ref)}">
          <img src="${esc(d.img)}" alt="" loading="lazy">
          <span class="pack-picker__ref">${esc(d.title)}</span>
          ${d.colour ? `<span class="product-card__colour"><span class="product-card__swatch" style="--swatch: ${esc(d.swatch)}" aria-hidden="true"></span>${esc(d.colour)}</span>` : ''}
        </button></li>`).join('');
    };

    const refresh = () => {
      const chosen = slots.filter((s) => s.querySelector('[data-slot-record]').value).length;
      submit.disabled = chosen < slots.length;
      if (status && !status.querySelector('a')) {
        status.textContent = chosen < slots.length ? `Choose all ${slots.length} posings to continue.` : '';
      }
      slots.forEach((s, i) => { if (i > 0) s.querySelector('[data-slot-waist]').hidden = same.checked; });
    };

    const choose = (slot, d) => {
      slot.querySelector('[data-slot-record]').value = [...new Set([d.ref, d.colour, d.title])].filter(Boolean).join(' · ');
      slot.querySelector('[data-slot-thumb]').style.backgroundImage = `url("${d.img}")`;
      slot.querySelector('[data-slot-title]').textContent = d.title;
      slot.querySelector('[data-slot-colour]').innerHTML = d.colour ? `<span class="product-card__swatch" style="--swatch: ${esc(d.swatch)}" aria-hidden="true"></span>${esc(d.colour)}` : '';
      slot.querySelector('[data-slot-action]').textContent = 'Change';
      const preview = document.querySelector(`[data-slot-preview="${slot.dataset.packSlot}"] .media`);
      if (preview) {
        preview.classList.remove('media--placeholder');
        preview.innerHTML = `<img src="${esc(d.img)}" alt="${esc(d.title)}">`;
      }
      slot.dataset.image = d.img;
      refresh();
    };

    tabs.forEach((t) => t.addEventListener('click', () => showCat(t.dataset.pickerCat)));
    slots.forEach((slot) => slot.querySelector('[data-pack-open]').addEventListener('click', () => {
      activeSlot = slot;
      picker.querySelector('[data-picker-slot]').textContent = `· Posing ${slot.dataset.packSlot}`;
      showCat(activeCat);
      picker.showModal();
    }));
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('[data-design]');
      if (!b || !activeSlot) return;
      choose(activeSlot, window.SJ_PACK_DESIGNS.find((d) => d.ref === b.dataset.design));
      picker.close();
    });
    picker.querySelector('[data-pack-close]').addEventListener('click', () => picker.close());
    picker.addEventListener('click', (e) => { if (e.target === picker) picker.close(); });
    same.addEventListener('change', refresh);

    // With "same waist", posing 1's measurement is copied to every posing before adding to the bag.
    form.addEventListener('submit', () => {
      if (!same.checked) return;
      const first = waists[0].values();
      waists.slice(1).forEach((w) => ['value', 'unit', 'equivalent'].forEach((k, i) => { w.record(k).value = first[i]; }));
    }, true);
    refresh();
  }

  /* ---------- Size: US inches first, cm only where confirmed ---------- */
  const sizeOption = form.querySelector('[data-size-option]');
  if (sizeOption) {
    const value = sizeOption.querySelector('[data-size-value]');
    const rec = (k) => sizeOption.querySelector(`[data-size-record="${k}"]`);
    sizeOption.addEventListener('change', (e) => {
      const n = e.target.value;
      const cm = e.target.dataset.sizeCm;
      const text = `${n}″ — ${cm || 'cm pending confirmation'}`;
      value.textContent = text;
      rec('in').value = `${n} in (US)`;
      rec('cm').value = cm || 'Pending confirmation';
      if (stickyVariant) stickyVariant.textContent = text;
    });
    waistRecord = ((before) => () => `${before()}${rec('in').value ? ` Size: ${rec('in').value}, ${rec('cm').value}.` : ''}`)(waistRecord);
  }

  /* ---------- Waist guide: five languages, follows the site language ---------- */
  const guide = document.querySelector('[data-waist-guide]');
  if (guide) {
    const showGuide = (code) => {
      if (!guide.querySelector(`[data-guide-panel="${code}"]`)) return;
      guide.querySelectorAll('[data-guide-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.guideTab === code)));
      guide.querySelectorAll('[data-guide-panel]').forEach((p) => { p.hidden = p.dataset.guidePanel !== code; });
    };
    guide.querySelectorAll('[data-guide-tab]').forEach((t) => t.addEventListener('click', () => showGuide(t.dataset.guideTab)));
    document.addEventListener('sj:lang', (e) => showGuide(e.detail));
    if (document.documentElement.dataset.lang) showGuide(document.documentElement.dataset.lang);
  }

  /* ---------- Prototype submit (not connected to Shopify) ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const price = document.querySelector('[data-price]');
    if (!price || button.disabled || !window.SJBag) return; // price pending: not sellable
    const props = {};
    form.querySelectorAll('input[type="hidden"][name^="properties["], input[type="date"][name^="properties["]').forEach((i) => {
      if (i.value) props[i.name.slice(11, -1)] = i.value;
    });
    const firstSlot = form.querySelector('[data-pack-slot][data-image]');
    const image = document.querySelector('.gallery img');
    window.SJBag.add({
      model: form.dataset.model,
      category: form.dataset.category,
      posings: Number(form.dataset.posings || 1),
      title: (window.SJi18n ? window.SJi18n.source(document.getElementById('product-title')) : document.getElementById('product-title').textContent).trim(),
      url: location.pathname.split('/').pop(),
      image: firstSlot ? firstSlot.dataset.image : (image ? image.getAttribute('src') : ''),
      price: Number(price.dataset.price),
      variant: selectedVariant(),
      properties: props,
    });
    if (status) {
      status.innerHTML = 'Added to your bag (preview). <a class="inline-link" href="bolsa.html">View bag</a>';
    }
  });

  /* ---------- Mobile sticky bar ---------- */
  const sticky = document.querySelector('[data-sticky-buy]');
  const mainCta = document.querySelector('[data-main-cta]');
  const trigger = document.querySelector('[data-sticky-trigger]');

  if (sticky && mainCta && 'IntersectionObserver' in window) {
    const footer = document.querySelector('footer');
    let ctaVisible = true;
    let footerVisible = false;

    const update = () => {
      const show = !ctaVisible && !footerVisible && mainCta.getBoundingClientRect().top < 0;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', String(!show));
      if (trigger) trigger.tabIndex = show ? 0 : -1;
    };

    new IntersectionObserver(([entry]) => { ctaVisible = entry.isIntersecting; update(); }).observe(mainCta);
    if (footer) new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; update(); }).observe(footer);

    if (trigger) {
      trigger.addEventListener('click', () => {
        mainCta.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }
})();
