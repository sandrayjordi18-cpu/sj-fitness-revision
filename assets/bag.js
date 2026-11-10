/* ==========================================================================
   S&J Fitness — bag.js (prototype only)
   Renders the bag preview from this browser's storage, with the same rules
   Shopify applies in the real cart:
   - No automatic discounts: a posing is 55 €; packs of 2 (90 €) and 3 (120 €)
     are products with their own price, chosen design by design.
   - 4 or more posings in the bag (singles + pack posings): no approved price
     yet, so no amounts and no checkout (cart.pack_max in the theme).
   - Products without a confirmed price cannot be added.
   In the theme this page is sections/main-cart.liquid (native cart).
   ========================================================================== */

(() => {
  const list = document.querySelector('[data-bag-items]');
  if (!list || !window.SJBag) return;

  const full = document.querySelector('[data-bag-full]');
  const empty = document.querySelector('[data-bag-empty]');
  const subtotal = document.querySelector('[data-bag-subtotal]');
  const tenDay = document.querySelector('[data-bag-ten-day]');
  const TEN_DAY = ['Bodybuilding', 'Classic Physique', 'Pack'];
  // Same production time, but not a posing: no pack, no posing limit.
  const LEAD_TEN = [...TEN_DAY, "Men's Physique"];
  const PACK_MAX = 3;
  const over = document.querySelector('[data-bag-over]');
  const hint = document.querySelector('[data-bag-hint]');
  const PACKS = { 2: { price: 90, url: 'pack-2-posings.html' }, 3: { price: 120, url: 'pack-3-posings.html' } };

  const lang = () => document.documentElement.dataset.lang || 'en';
  const money = (n) => new Intl.NumberFormat(lang(), { style: 'currency', currency: 'EUR' }).format(n);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Posings in an item: a pack counts its posings, a single posing counts one.
  const posingsOf = (i) => (i.category === 'Pack' ? (i.posings || 0) : (TEN_DAY.includes(i.category) ? 1 : 0)) * i.qty;

  const render = () => {
    const items = window.SJBag.read();
    full.hidden = items.length === 0;
    empty.hidden = items.length > 0;
    if (!items.length) return;

    const posings = items.reduce((n, i) => n + posingsOf(i), 0);
    const overLimit = posings > PACK_MAX;
    let total = 0;

    list.innerHTML = items.map((item) => {
      const line = item.price * item.qty;
      total += line;
      const meta = (item.variant ? [`<div>${esc(item.variant)}</div>`] : [])
        .concat(Object.entries(item.properties || {}).map(([k, v]) => `<div><dt>${esc(k)}:</dt> <dd>${esc(v)}</dd></div>`))
        .join('');
      const lead = LEAD_TEN.includes(item.category)
        ? 'Made in up to 10 working days once the atelier confirms your measurements and order details. Shipping time is added.'
        : 'Production time to be confirmed by the atelier.';
      return `<li class="cart-item" data-key="${esc(item.key)}">
        <a href="${esc(item.url)}"><div class="media" style="--ratio: 4 / 5"><img src="${esc(item.image)}" alt="${esc(item.title)}"></div></a>
        <div>
          <h2 class="cart-item__title"><a href="${esc(item.url)}">${esc(item.title)}</a></h2>
          <dl class="cart-item__meta">${meta}</dl>
          <p class="cart-item__lead">${lead}</p>
          <div class="cart-item__row">
            <label class="visually-hidden" for="qty-${esc(item.key)}">Quantity</label>
            <input class="field cart-item__qty" id="qty-${esc(item.key)}" type="number" min="0" value="${item.qty}" data-qty>
            <span class="cart-item__price">${overLimit ? `${money(item.price)} each` : money(line)}</span>
            <button class="cart-item__remove" type="button" data-remove>Remove</button>
          </div>
        </div>
      </li>`;
    }).join('');

    subtotal.textContent = overLimit ? 'Price to be confirmed' : money(total);
    // 2 or 3 posings bought as singles (or mixed): point to the pack, never discount automatically.
    const pack = !overLimit && PACKS[posings];
    const isExactPack = items.length === 1 && items[0].category === 'Pack' && items[0].qty === 1;
    hint.hidden = !(pack && !isExactPack && total > pack.price);
    if (!hint.hidden) {
      hint.innerHTML = `${posings} posings: the pack of ${posings} costs ${money(pack.price)}. <a class="inline-link" href="${pack.url}">Choose the pack</a>`;
    }
    over.hidden = !overLimit;
    tenDay.hidden = !items.some((i) => LEAD_TEN.includes(i.category));
  };

  list.addEventListener('change', (e) => {
    if (!e.target.matches('[data-qty]')) return;
    const key = e.target.closest('[data-key]').dataset.key;
    const qty = Math.max(0, Math.floor(Number(e.target.value) || 0));
    window.SJBag.write(window.SJBag.read().map((i) => (i.key === key ? { ...i, qty } : i)).filter((i) => i.qty > 0));
    render();
  });

  list.addEventListener('click', (e) => {
    if (!e.target.matches('[data-remove]')) return;
    const key = e.target.closest('[data-key]').dataset.key;
    window.SJBag.write(window.SJBag.read().filter((i) => i.key !== key));
    render();
  });

  document.addEventListener('sj:lang', render);
  render();
})();
