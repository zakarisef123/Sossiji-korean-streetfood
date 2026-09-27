# Activer la commande en ligne (à emporter)

Le panier reste **invisible** sur le site tant que ces 3 étapes ne sont pas faites.
Dès qu'elles le sont, les boutons « + » et « Commander » apparaissent tout seuls.

## 1. Stripe (paiement)

1. Créez un compte sur <https://stripe.com> (gratuit, sans abonnement) et complétez les infos de l'entreprise et l'IBAN.
2. **Paramètres → Moyens de paiement** : activez **TWINT**, cartes, Apple Pay, Google Pay.
3. **Développeurs → Clés API** : copiez la **clé secrète** (`sk_test_…` pour tester, `sk_live_…` pour les vrais paiements).
4. **Développeurs → Webhooks → Ajouter un endpoint** :
   - URL : `https://sosiji.netlify.app/.netlify/functions/stripe-webhook`
   - Événements : `checkout.session.completed` et `checkout.session.async_payment_succeeded`
   - Copiez le **secret de signature** (`whsec_…`).

## 2. Notification des commandes

Au moins un des deux :

- **Telegram (recommandé, instantané et gratuit)**
  1. Dans Telegram, écrivez à **@BotFather** → `/newbot` → copiez le **token**.
  2. Créez un groupe « Commandes Sosiji » avec l'équipe et ajoutez-y le bot.
  3. Envoyez un message dans le groupe, puis ouvrez
     `https://api.telegram.org/bot<TOKEN>/getUpdates` : le nombre après `"chat":{"id":` est le **chat id** (souvent négatif, ex. `-1001234567890`).
- **E-mail** : compte gratuit sur <https://resend.com> → clé API.

## 3. Variables dans Netlify

Netlify → votre site → **Site configuration → Environment variables** → ajoutez :

| Variable | Valeur |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` puis `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` |
| `TELEGRAM_BOT_TOKEN` | token de @BotFather |
| `TELEGRAM_CHAT_ID` | id du groupe |
| `RESEND_API_KEY` *(optionnel)* | clé Resend |
| `ORDER_EMAIL_TO` *(optionnel)* | adresse qui reçoit les commandes |

Puis **Deploys → Trigger deploy**.

## Tester

Avec les clés `sk_test_…`, payez avec la carte de test `4242 4242 4242 4242`
(date future, CVC au choix). Le message Telegram arrive marqué **⚠️ TEST**.
Quand tout marche, remplacez par les clés `live` (et recréez le webhook en mode live).

## Au quotidien

- **Rupture d'un plat** : dans `data/restaurant.json`, passez `"available": false` → le bouton affiche « Épuisé ».
- **Couper les commandes en ligne** (soirée chargée) : `"enabled": false` dans `data/restaurant.json`.
- **Prix / horaires** : `data/restaurant.json` (prix en centimes : `1190` = CHF 11.90).
- **Rembourser** : tableau de bord Stripe → Paiements → Rembourser.
