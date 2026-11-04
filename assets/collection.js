/* ==========================================================================
   S&J Fitness — collection.js
   Filter drawer open/close and scroll lock, plus the prototype colour filter
   over the cards on the page. In Shopify, filtering is done by
   collection.filters (Search & Discovery) + Section Rendering API.
   Shopify: assets/collection.js, loaded by main-collection-product-grid.
   ========================================================================== */

(() => {
  const filters = document.querySelector('[data-filters]');
  if (!filters) return;

  const root = document.documentElement;
  const close = () => { filters.open = false; filters.querySelector('summary').focus(); };

  filters.addEventListener('toggle', () => {
    root.classList.toggle('has-drawer', filters.open);
  });

  filters.querySelector('[data-filters-close]')?.addEventListener('click', close);

  // Click on the dimmed backdrop (the details element itself, outside the panel).
  filters.addEventListener('click', (e) => {
    if (filters.open && !e.target.closest('.filters__panel, summary')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filters.open) close();
  });

  /* ---------- Prototype colour filter ---------- */
  const form = filters.querySelector('[data-filter-form]');
  const cards = [...document.querySelectorAll('.product-grid > .product-card[data-colours]')];
  if (!form || !cards.length) return;

  const total = cards.length;
  const count = document.querySelector('[data-filter-count]');
  const showing = document.querySelector('[data-filter-showing]');
  const bar = document.querySelector('[data-filter-bar]');
  const empty = document.querySelector('[data-filter-empty]');
  const active = filters.querySelector('[data-filter-active]');
  const applyTotal = form.querySelector('[data-filter-total]');

  const apply = () => {
    const chosen = [...form.querySelectorAll('input[name="colour"]:checked')].map((i) => i.value);
    let shown = 0;
    cards.forEach((card) => {
      const match = !chosen.length || card.dataset.colours.split(' ').some((c) => chosen.includes(c));
      card.hidden = !match;
      if (match) shown += 1;
    });
    if (count) count.textContent = shown;
    if (applyTotal) applyTotal.textContent = shown;
    if (showing) showing.textContent = `Showing ${shown} of ${total}`;
    if (bar) bar.style.width = `${(shown / total) * 100}%`;
    if (empty) empty.hidden = shown > 0;
    if (active) active.textContent = chosen.length ? `(${chosen.length})` : '';
  };

  form.addEventListener('change', apply);
  form.addEventListener('reset', () => setTimeout(apply));
  form.addEventListener('submit', (e) => { e.preventDefault(); apply(); close(); });
  document.querySelector('[data-filter-clear]')?.addEventListener('click', () => { form.reset(); });
})();
