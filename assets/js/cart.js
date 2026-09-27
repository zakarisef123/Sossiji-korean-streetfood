/* ==========================================================
   Panier — commande à emporter avec paiement en ligne (Stripe)
   Tout reste masqué tant que le serveur ne confirme pas que
   Stripe et les notifications sont configurés.
   ========================================================== */
(() => {
  const EN = document.documentElement.lang === 'en';
  const t = (fr, en) => (EN ? en : fr);
  const Core = window.SosijiCore;
  const STORE = 'sosiji-cart';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const drawer = $('.cart');
  const overlay = $('.cart-overlay');
  const fab = $('.cart-fab');
  const form = $('.cart__form');
  const toast = $('.toast');
  if (!drawer || !Core) return;

  let data = null;
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { cart = {}; }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(cart)); } catch (e) { /* stockage indisponible */ } };

  const itemName = (item) => (EN && item.name_en) || item.name;
  const chf = (cents) => Core.formatCHF(cents);

  function priced() {
    const items = Object.entries(cart).map(([id, qty]) => ({ id, qty }));
    if (!items.length) return null;
    try { return Core.priceCart(data, items); } catch (e) { return null; }
  }

  // Retire du panier les articles qui n'existent plus ou sont épuisés
  function sanitize() {
    const byId = new Map(data.items.map((i) => [i.id, i]));
    for (const id of Object.keys(cart)) {
      const item = byId.get(id);
      if (!item || item.available === false || !(cart[id] > 0)) delete cart[id];
    }
    save();
  }

  function render() {
    const byId = new Map(data.items.map((i) => [i.id, i]));
    const p = priced();
    const count = p ? p.count : 0;

    // Bouton flottant
    fab.hidden = count === 0;
    $('.cart-fab__count', fab).textContent = count;
    $('.cart-fab__total', fab).textContent = p ? chf(p.total) : '';

    // Lignes
    $('.cart__empty', drawer).hidden = count > 0;
    form.hidden = count === 0;
    $('.cart__lines', drawer).innerHTML = p ? p.lines.map((l) => `
      <li>
        <span class="cart__name">${itemName(byId.get(l.id))}</span>
        <span class="cart__qty">
          <button type="button" data-dec="${l.id}" aria-label="${t('Retirer un', 'Remove one')}">−</button>
          <b>${l.qty}</b>
          <button type="button" data-inc="${l.id}" aria-label="${t('Ajouter un', 'Add one')}">+</button>
        </span>
        <span class="cart__price">${chf(l.total)}</span>
      </li>`).join('') : '';

    if (!p) return;
    $('.cart__total b', drawer).textContent = chf(p.total);
    $('.cart__age', drawer).hidden = !p.hasAlcohol;
    renderSlots();
  }

  function renderSlots() {
    const select = form.elements.pickup;
    const slots = Core.pickupSlots(data);
    const closed = $('.cart__closed', drawer);
    const pay = $('.cart__pay', drawer);
    const p = priced();
    const previous = select.value;
    select.innerHTML = slots.map((s) => `<option value="${s}">${t('Aujourd’hui', 'Today')} ${s}</option>`).join('');
    if (slots.includes(previous)) select.value = previous;
    select.disabled = !slots.length;
    pay.disabled = !slots.length;
    closed.hidden = !!slots.length;
    if (!slots.length) {
      const next = Core.nextOpening(data, undefined, EN ? 'en' : 'fr');
      closed.textContent = t(
        `La commande en ligne est fermée pour le moment.${next ? ` Retour ${next}.` : ''}`,
        `Online ordering is closed right now.${next ? ` Back ${next}.` : ''}`
      );
    }
    pay.textContent = p ? t(`Payer ${chf(p.total)}`, `Pay ${chf(p.total)}`) : t('Payer', 'Pay');
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.remove('is-on');
    void toast.offsetWidth; // relance l'animation
    toast.classList.add('is-on');
  }

  function add(id) {
    const item = data.items.find((i) => i.id === id);
    if (!item || item.available === false) return;
    cart[id] = Math.min((cart[id] || 0) + 1, 20);
    save();
    render();
    fab.classList.remove('bump');
    void fab.offsetWidth;
    fab.classList.add('bump');
    showToast(`✓ ${itemName(item)} ${t('ajouté', 'added')} · 담았어요!`);
  }

  // Ouverture / fermeture du panneau
  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    render();
    overlay.hidden = false;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.inert = false;
    document.documentElement.classList.add('cart-lock');
    $('.cart__close', drawer).focus();
  }
  function closeCart() {
    overlay.hidden = true;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    document.documentElement.classList.remove('cart-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function wire() {
    $$('.js-add').forEach((btn) => {
      const item = data.items.find((i) => i.id === btn.dataset.add);
      btn.hidden = false;
      if (!item || item.available === false) {
        btn.disabled = true;
        btn.textContent = t('Épuisé', 'Sold out');
        btn.classList.add('is-soldout');
      }
      btn.addEventListener('click', (e) => { e.stopPropagation(); add(btn.dataset.add); });
    });
    $$('.js-cart-open').forEach((b) => {
      b.hidden = false;
      b.addEventListener('click', () => {
        if (priced()) openCart();
        else document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
      });
    });
    $$('.js-takeaway').forEach((a) => { a.hidden = false; });
    const block = $('[data-block="order"]');
    if (block) block.hidden = false;

    $('.cart__close', drawer).addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeCart(); });

    $('.cart__lines', drawer).addEventListener('click', (e) => {
      const inc = e.target.closest('[data-inc]');
      const dec = e.target.closest('[data-dec]');
      if (inc) cart[inc.dataset.inc] = Math.min((cart[inc.dataset.inc] || 0) + 1, 20);
      if (dec) {
        cart[dec.dataset.dec] = (cart[dec.dataset.dec] || 0) - 1;
        if (cart[dec.dataset.dec] <= 0) delete cart[dec.dataset.dec];
      }
      if (inc || dec) { save(); render(); }
    });

    // Les créneaux avancent avec l'heure
    setInterval(() => { if (drawer.classList.contains('is-open') && priced()) renderSlots(); }, 60 * 1000);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('.cart__error', drawer);
      const pay = $('.cart__pay', drawer);
      const p = priced();
      const f = form.elements;
      const fail = (msg) => { err.textContent = msg; err.hidden = false; };
      err.hidden = true;
      if (!p) return;
      if (f.name.value.trim().length < 2) return fail(t('Indiquez votre prénom.', 'Please enter your name.'));
      if (!/^[+0-9 ().-]{8,20}$/.test(f.phone.value.trim())) return fail(t('Indiquez un numéro de téléphone valide.', 'Please enter a valid phone number.'));
      if (p.hasAlcohol && !f.ageOk.checked) return fail(t('Confirmez avoir 16 ans ou plus pour la bière.', 'Please confirm you are 16 or older for beer.'));

      pay.disabled = true;
      pay.textContent = t('Redirection vers le paiement…', 'Redirecting to payment…');
      try {
        const res = await fetch('/.netlify/functions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: p.lines.map((l) => ({ id: l.id, qty: l.qty })),
            pickup: f.pickup.value,
            name: f.name.value,
            phone: f.phone.value,
            note: f.note.value,
            ageOk: f.ageOk.checked,
            lang: EN ? 'en' : 'fr',
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.url) throw new Error(out.error || t('Le paiement est momentanément indisponible.', 'Payment is temporarily unavailable.'));
        location.href = out.url;
      } catch (ex) {
        fail(ex.message);
        pay.disabled = false;
        renderSlots();
      }
    });
  }

  Promise.resolve(window.SOSIJI_DATA)
    .then((d) => {
      if (!d || !d.ordering || !d.ordering.enabled) return null;
      data = d;
      return fetch('/.netlify/functions/checkout', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null));
    })
    .then((status) => {
      if (!status || !status.enabled) return; // pas encore configuré → rien ne s'affiche
      sanitize();
      wire();
      render();
    })
    .catch(() => { /* fonctions indisponibles (ex. aperçu local) */ });
})();
