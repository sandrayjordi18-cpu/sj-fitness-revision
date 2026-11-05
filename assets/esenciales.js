/* ==========================================================================
   S&J Fitness — esenciales.js
   Adds the subtle ashes of the S&J Essentials hero and pauses its motion while
   it is off screen. Reduced motion: no ashes, the CSS shows the final state.
   Shopify: assets/esenciales.js, loaded by sections/esenciales-hero.liquid.
   ========================================================================== */

(() => {
  const root = document.querySelector('[data-esenciales]');
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ashes = root.querySelector('.es__ashes');
  for (let i = 0; i < 48; i += 1) {
    const ash = document.createElement('i');
    ash.className = 'es__ash';
    ash.style.cssText = `--x:${67 + Math.random() * 15}%;--y:${45 + Math.random() * 40}%;--s:${1 + Math.random() * 3}px;--t:${3 + Math.random() * 3}s;--d:${Math.random() * 2}s;--drift:${-45 + Math.random() * 90}px`;
    ashes.appendChild(ash);
  }

  new IntersectionObserver(([entry]) => {
    root.classList.toggle('is-offscreen', !entry.isIntersecting);
  }).observe(root);
})();
