/* ==========================================================
   Logique de commande partagée entre le site (navigateur)
   et les fonctions Netlify (serveur) : créneaux de retrait
   à l'heure de Genève et calcul du panier.
   ========================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SosijiCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const TZ = 'Europe/Zurich';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Jour de la semaine (0 = dimanche) et minutes depuis minuit, heure de Genève
  function zurichNow(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const get = (t) => parts.find((p) => p.type === t).value;
    return { dow: DAYS.indexOf(get('weekday')), minutes: (+get('hour') % 24) * 60 + +get('minute') };
  }

  const toMin = (t) => {
    const [h, m] = String(t).trim().split(/[:h]/);
    return +h * 60 + (+m || 0);
  };
  const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const splitSlot = (slot) => slot.split(/\s*[–-]\s*/);

  function todaySchedule(data, now = zurichNow()) {
    return (data.hours || []).find((row) => row.dow.includes(now.dow)) || { slots: [] };
  }

  // Heures de retrait possibles aujourd'hui (pas de 15 min par défaut)
  function pickupSlots(data, now = zurichNow()) {
    const o = data.ordering || {};
    const step = o.slotStep || 15;
    const prep = o.prepMinutes || 20;
    const lastBefore = o.lastPickupBeforeClose || 15;
    const out = [];
    for (const slot of todaySchedule(data, now).slots) {
      const [a, b] = splitSlot(slot).map(toMin);
      let t = Math.max(a + step, now.minutes + prep);
      t = Math.ceil(t / step) * step;
      for (; t <= b - lastBefore; t += step) out.push(fmt(t));
    }
    return out;
  }

  // Prochaine ouverture (pour afficher « Commandes à nouveau possibles … »)
  function nextOpening(data, now = zurichNow(), lang = 'fr') {
    for (let d = 0; d < 8; d++) {
      const dow = (now.dow + d) % 7;
      const row = (data.hours || []).find((r) => r.dow.includes(dow));
      if (!row) continue;
      for (const slot of row.slots) {
        const start = toMin(splitSlot(slot)[0]);
        if (d > 0 || start > now.minutes) {
          if (lang === 'en') {
            const label = d === 0 ? 'today' : d === 1 ? 'tomorrow' : `on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow]}`;
            return `${label} at ${fmt(start)}`;
          }
          const label = d === 0 ? "aujourd'hui" : d === 1 ? 'demain' : ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dow];
          return `${label} à ${fmt(start)}`;
        }
      }
    }
    return null;
  }

  const formatCHF = (cents) => `CHF ${(cents / 100).toFixed(2)}`;

  // Vérifie et calcule le panier à partir du catalogue (les prix du client ne sont jamais utilisés)
  function priceCart(data, items) {
    if (!Array.isArray(items) || !items.length) throw new Error('Le panier est vide.');
    const catalog = new Map((data.items || []).map((i) => [i.id, i]));
    const merged = new Map();
    for (const it of items) {
      const product = catalog.get(it && it.id);
      const qty = Number(it && it.qty);
      if (!product) throw new Error('Un article du panier n’existe plus. Rechargez la page.');
      if (product.available === false) throw new Error(`${product.name} n’est plus disponible aujourd’hui.`);
      if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error('Quantité invalide.');
      merged.set(product.id, (merged.get(product.id) || 0) + qty);
    }
    const lines = [...merged].map(([id, qty]) => {
      const p = catalog.get(id);
      return { id, name: p.name, unit: p.price, qty, total: p.price * qty, alcohol: !!p.alcohol };
    });
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const max = (data.ordering && data.ordering.maxItems) || 30;
    if (count > max) throw new Error(`Maximum ${max} articles par commande en ligne. Appelez-nous pour les grosses commandes.`);
    return {
      lines,
      count,
      total: lines.reduce((s, l) => s + l.total, 0),
      hasAlcohol: lines.some((l) => l.alcohol),
    };
  }

  return { TZ, zurichNow, toMin, fmt, splitSlot, todaySchedule, pickupSlots, nextOpening, formatCHF, priceCart };
});
