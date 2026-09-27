/* GET  → la commande en ligne est-elle disponible ? { enabled, slots }
   POST → crée une session de paiement Stripe Checkout et renvoie { url } */
const data = require('../../data/restaurant.json');
const core = require('../../assets/js/ordering-core.js');
const { stripe, notificationChannels, json } = require('../lib/stripe');

function isConfigured() {
  const ch = notificationChannels();
  return !!(
    data.ordering && data.ordering.enabled &&
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    (ch.telegram || ch.email)
  );
}

const clean = (s, max) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return json(200, { enabled: isConfigured(), slots: core.pickupSlots(data) });
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Méthode non autorisée' });
  if (!isConfigured()) return json(503, { error: 'La commande en ligne est momentanément indisponible.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Requête invalide.' });
  }
  const en = body.lang === 'en';

  // Panier recalculé à partir du catalogue du serveur
  let cart;
  try {
    cart = core.priceCart(data, body.items);
  } catch (e) {
    return json(400, { error: e.message });
  }

  // Heure de retrait : doit être un créneau valable aujourd'hui (5 min de tolérance)
  const now = core.zurichNow();
  const allowed = core.pickupSlots(data, { dow: now.dow, minutes: Math.max(0, now.minutes - 5) });
  const pickup = clean(body.pickup, 5);
  if (!allowed.includes(pickup)) {
    return json(400, { error: en ? 'This pickup time is no longer available. Please pick another one.' : 'Ce créneau de retrait n’est plus disponible. Choisissez-en un autre.' });
  }

  const name = clean(body.name, 60);
  const phone = clean(body.phone, 20);
  const note = clean(body.note, 200);
  if (name.length < 2) return json(400, { error: en ? 'Please enter your name.' : 'Indiquez votre prénom.' });
  if (!/^[+0-9 ().-]{8,20}$/.test(phone)) return json(400, { error: en ? 'Please enter a valid phone number.' : 'Indiquez un numéro de téléphone valide.' });
  if (cart.hasAlcohol && body.ageOk !== true) {
    return json(400, { error: en ? 'Please confirm you are 16 or older to order beer.' : 'Confirmez avoir 16 ans ou plus pour commander de la bière.' });
  }

  const summary = cart.lines.map((l) => `${l.qty}× ${l.name}`).join(' | ').slice(0, 480);
  const site = process.env.URL || `https://${event.headers.host}`;

  try {
    const session = await stripe('POST', '/checkout/sessions', {
      mode: 'payment',
      locale: en ? 'en' : 'fr',
      line_items: cart.lines.map((l) => ({
        quantity: l.qty,
        price_data: { currency: 'chf', unit_amount: l.unit, product_data: { name: l.name } },
      })),
      metadata: { pickup, name, phone, note, items: summary },
      payment_intent_data: { description: `Sosiji · retrait ${pickup} · ${name}` },
      success_url: `${site}/commande-confirmee.html?session_id={CHECKOUT_SESSION_ID}${en ? '&lang=en' : ''}`,
      cancel_url: `${site}/${en ? 'en' : ''}#menu`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    return json(200, { url: session.url });
  } catch (e) {
    console.error('Stripe :', e.message);
    return json(502, { error: en ? 'Payment is temporarily unavailable. Please call us.' : 'Le paiement est momentanément indisponible. Appelez-nous.' });
  }
};
