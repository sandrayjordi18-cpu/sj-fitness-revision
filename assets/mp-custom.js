/* ==========================================================================
   S&J Fitness — mp-custom.js
   Men's Physique: length in cm and an optional name on the back of the
   waistband, with its lettering style and a live preview. Both are saved on the
   order line (hidden properties, read by product.js like the waist).
   Shopify: assets/mp-custom.js, loaded by main-product when the blocks exist.
   ========================================================================== */

(() => {
  /* ---------- Length ---------- */
  document.querySelectorAll('[data-mp-length]').forEach((box) => {
    const input = box.querySelector('[data-mp-length-input]');
    const record = box.querySelector('[data-mp-length-record]');
    input.addEventListener('input', () => { record.value = parseFloat(input.value) > 0 ? `${input.value} cm` : ''; });
  });

  /* ---------- A size is needed before adding to the bag ---------- */
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-product-form]');
    const size = form && form.querySelector('[data-size-option]');
    if (!size || size.querySelector('input:checked')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const status = form.querySelector('[data-form-status]');
    const msg = document.querySelector('[data-mp-messages]');
    if (status) status.textContent = (msg && msg.dataset.sizeFirst) || 'Choose your size first.';
    size.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, true);

  /* ---------- Name on the waistband ---------- */
  document.querySelectorAll('[data-wb-name]').forEach((box) => {
    const input = box.querySelector('[data-wb-name-input]');
    const count = box.querySelector('[data-wb-name-count]');
    const preview = box.querySelector('[data-wb-name-preview]');
    const samples = box.querySelectorAll('[data-wb-name-sample]');
    const recName = box.querySelector('[data-wb-name-record="name"]');
    const recFont = box.querySelector('[data-wb-name-record="font"]');
    const max = Number(input.maxLength) || 12;

    const update = () => {
      const name = input.value.replace(/\s+/g, ' ').trim();
      const font = box.querySelector('[data-wb-name-font]:checked');
      count.textContent = `${input.value.length}/${max}`;
      samples.forEach((s) => { s.textContent = name || s.dataset.sampleDefault; });
      preview.hidden = !name;
      preview.textContent = name;
      preview.dataset.font = font ? font.value : '';
      // Saved only when there is a name: the style alone means nothing.
      recName.value = name;
      recFont.value = name && font ? font.dataset.fontLabel : '';
    };

    input.addEventListener('input', update);
    box.querySelectorAll('[data-wb-name-font]').forEach((r) => r.addEventListener('change', update));
    update();
  });
})();
