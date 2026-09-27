/* ==========================================================
   SOSIJI — infos du restaurant
   C'est le SEUL fichier à modifier pour mettre à jour les infos.
   Un champ laissé vide ('') = l'élément correspondant est masqué.
   ========================================================== */
window.SOSIJI = {
  // Adresse du site (pour Google et les aperçus de partage)
  siteUrl: 'https://sosiji.netlify.app',

  // Livraison : lien Uber Eats → boutons « Livraison »
  // (la commande à emporter avec paiement en ligne se règle dans data/restaurant.json)
  orderUrl: 'https://www.ubereats.com/ch-fr/store/sosiji-korean-street-food/RUV9M3iTTu6KDACkkptbkw',

  // Lien du compte Instagram, ex. 'https://www.instagram.com/sosiji...'
  instagramUrl: 'https://www.instagram.com/sosiji.belleterre/',

  // Adresse complète
  address: 'Place du Traité-de-Turin 3, 1226 Thônex',

  // Contact
  phone: '076 288 16 13',
  email: '',

  // Horaires et menu : voir data/restaurant.json

  // Bandeau d'annonce en haut du site (plat du moment, fermeture, menu spécial…)
  // Laisser vide pour le masquer.
  announcement: '',
  announcement_en: '',   // même texte en anglais (version /en)

  // Mentions légales (obligatoire en Suisse)
  legal: {
    company: '',   // raison sociale, ex. 'Sosiji Sàrl'
    owner: '',     // responsable du site
    ide: '',       // numéro IDE, ex. 'CHE-123.456.789' (si inscrit au RC)
  },
};
