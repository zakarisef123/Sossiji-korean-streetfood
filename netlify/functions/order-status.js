/* Page de confirmation : renvoie le récapitulatif d'une commande (sans données sensibles). */
const { stripe, orderCode, json } = require('../lib/stripe');

exports.handler = async (event) => {
  const id = (event.queryStringParameters || {}).session_id || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return json(400, { error: 'Commande introuvable.' });
  if (!process.env.STRIPE_SECRET_KEY) return json(503, { error: 'Service indisponible.' });
  try {
    const s = await stripe('GET', `/checkout/sessions/${id}`);
    const m = s.metadata || {};
    return json(200, {
      code: orderCode(s.id),
      paid: s.payment_status === 'paid',
      status: s.status,
      pickup: m.pickup,
      name: (m.name || '').split(' ')[0],
      items: (m.items || '').split(' | ').filter(Boolean),
      total: s.amount_total,
    });
  } catch (e) {
    return json(404, { error: 'Commande introuvable.' });
  }
};
