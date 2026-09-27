/* Outils serveur : appels à l'API Stripe (sans dépendance), vérification
   des webhooks et envoi des notifications de commande. */
const crypto = require('crypto');

const STRIPE_API = 'https://api.stripe.com/v1';

// Encodage « form » attendu par Stripe : a[b][0][c]=...
function encodeForm(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') encodeForm(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out.join('&');
}

async function stripe(method, path, params) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? encodeForm(params) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error((json.error && json.error.message) || `Stripe ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

// Vérifie l'en-tête Stripe-Signature (t=...,v1=...)
function verifyWebhook(payload, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v])
  );
  const signatures = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${payload}`, 'utf8').digest('hex');
  return signatures.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

// Code court lisible pour la cuisine, dérivé de l'identifiant de session
const orderCode = (sessionId) => sessionId.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();

function notificationChannels() {
  return {
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    email: !!(process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_TO),
  };
}

// Envoie la commande sur Telegram et/ou par e-mail. Renvoie le nombre de canaux réussis.
async function notifyOrder(text, subject) {
  const ch = notificationChannels();
  const jobs = [];
  if (ch.telegram) {
    jobs.push(fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    }).then((r) => { if (!r.ok) throw new Error(`Telegram ${r.status}`); }));
  }
  if (ch.email) {
    jobs.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Sosiji Commandes <onboarding@resend.dev>',
        to: process.env.ORDER_EMAIL_TO.split(',').map((s) => s.trim()),
        subject,
        text,
      }),
    }).then((r) => { if (!r.ok) throw new Error(`Resend ${r.status}`); }));
  }
  const results = await Promise.allSettled(jobs);
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Notification échouée :', r.reason));
  return results.filter((r) => r.status === 'fulfilled').length;
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

module.exports = { stripe, encodeForm, verifyWebhook, orderCode, notificationChannels, notifyOrder, json };
