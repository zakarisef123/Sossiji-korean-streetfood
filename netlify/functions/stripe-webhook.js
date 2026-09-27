/* Webhook Stripe : quand une commande est payée, on prévient le restaurant
   (Telegram et/ou e-mail). À déclarer dans Stripe → Développeurs → Webhooks. */
const { verifyWebhook, orderCode, notifyOrder, json } = require('../lib/stripe');

const formatCHF = (cents) => `CHF ${(cents / 100).toFixed(2)}`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Méthode non autorisée' });

  const payload = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!verifyWebhook(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)) {
    return json(400, { error: 'Signature invalide' });
  }

  const evt = JSON.parse(payload);
  const s = evt.data && evt.data.object;
  const paid =
    (evt.type === 'checkout.session.completed' && s.payment_status === 'paid') ||
    evt.type === 'checkout.session.async_payment_succeeded';
  if (!paid) return json(200, { ignored: evt.type });

  const m = s.metadata || {};
  const code = orderCode(s.id);
  const test = evt.livemode ? '' : '⚠️ TEST : pas un vrai paiement\n';
  const text = [
    `${test}🔔 NOUVELLE COMMANDE #${code}`,
    `🕐 Retrait : ${m.pickup || '?'}`,
    `👤 ${m.name || '?'} · ${m.phone || '?'}`,
    '',
    ...(m.items || '').split(' | '),
    m.note ? `\n📝 ${m.note}` : '',
    `\n💳 Payé ${formatCHF(s.amount_total || 0)}`,
  ].join('\n');

  const sent = await notifyOrder(text, `Commande #${code} · retrait ${m.pickup || '?'} · ${m.name || ''}`);
  // Si aucune notification n'est partie, on renvoie une erreur pour que Stripe réessaie.
  return sent > 0 ? json(200, { ok: true }) : json(500, { error: 'Notification impossible' });
};
