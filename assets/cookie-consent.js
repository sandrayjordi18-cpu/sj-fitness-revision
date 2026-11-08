/* ==========================================================================
   S&J Fitness — cookie-consent.js (prototype only)
   Shows the cookie notice on the first visit and the preferences from the
   footer button. The prototype sets no analytics or marketing cookies: the
   choice is only stored in this browser. In Shopify the notice is Shopify's own
   and the footer button calls window.privacyBanner.showPreferences().
   Texts are in English and translated by i18n.js like the rest of the page.
   ========================================================================== */

(() => {
  const KEY = 'sj-cookie-consent';

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  };
  const save = (choice) => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...choice, date: new Date().toISOString() })); } catch (e) { /* storage blocked */ }
  };

  const notice = document.createElement('section');
  notice.className = 'cookie-notice color-ink';
  notice.setAttribute('aria-labelledby', 'cookie-notice-title');
  notice.hidden = true;
  notice.innerHTML = `
    <h2 class="cookie-notice__title" id="cookie-notice-title">Cookies</h2>
    <p>We use the cookies the shop needs to work. With your consent, we would also use analytics and marketing cookies. You can change your choice at any time from “Cookie settings” at the foot of the page. <a href="cookies.html">Cookie policy</a></p>
    <div class="cookie-notice__actions">
      <button class="button" type="button" data-cookie="reject">Reject</button>
      <button class="button" type="button" data-cookie="accept">Accept</button>
      <button class="button cookie-notice__settings" type="button" data-cookie="settings">Settings</button>
    </div>`;

  const prefs = document.createElement('dialog');
  prefs.className = 'cookie-prefs color-ink';
  prefs.setAttribute('aria-labelledby', 'cookie-prefs-title');
  prefs.innerHTML = `
    <h2 class="cookie-prefs__title" id="cookie-prefs-title">Cookie settings</h2>
    <ul class="cookie-prefs__list" role="list">
      <li class="cookie-prefs__item">
        <span><strong>Necessary</strong></span>
        <span class="cookie-prefs__always">Always active</span>
        <p>Needed for your bag, your language and your cookie choice.</p>
      </li>
      <li class="cookie-prefs__item">
        <label for="cookie-analytics">Analytics</label>
        <input type="checkbox" id="cookie-analytics" data-cookie-type="analytics">
        <p>Visit statistics that help us improve the shop.</p>
      </li>
      <li class="cookie-prefs__item">
        <label for="cookie-marketing">Marketing</label>
        <input type="checkbox" id="cookie-marketing" data-cookie-type="marketing">
        <p>Personalised advertising. We do not use any at the moment.</p>
      </li>
    </ul>
    <div class="cookie-prefs__actions">
      <button class="button" type="button" data-cookie="save">Save choices</button>
      <button class="button" type="button" data-cookie="accept">Accept all</button>
    </div>`;

  const close = (choice) => {
    save(choice);
    notice.hidden = true;
    if (prefs.open) prefs.close();
  };

  const openPrefs = () => {
    const current = read() || {};
    prefs.querySelectorAll('[data-cookie-type]').forEach((box) => { box.checked = !!current[box.dataset.cookieType]; });
    if (typeof prefs.showModal === 'function') prefs.showModal(); else prefs.setAttribute('open', '');
  };

  const onClick = (e) => {
    const btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    const action = btn.dataset.cookie;
    if (action === 'accept') close({ analytics: true, marketing: true });
    if (action === 'reject') close({ analytics: false, marketing: false });
    if (action === 'settings') openPrefs();
    if (action === 'save') {
      const choice = {};
      prefs.querySelectorAll('[data-cookie-type]').forEach((box) => { choice[box.dataset.cookieType] = box.checked; });
      close(choice);
    }
  };

  const start = () => {
    document.body.append(notice, prefs);
    notice.addEventListener('click', onClick);
    prefs.addEventListener('click', onClick);
    document.querySelectorAll('[data-cookie-settings]').forEach((b) => b.addEventListener('click', openPrefs));
    if (!read()) notice.hidden = false;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
