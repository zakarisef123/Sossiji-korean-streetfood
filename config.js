/* ==========================================================
   SOSIJI — infos du restaurant
   C'est le SEUL fichier à modifier pour mettre à jour les infos.
   Un champ laissé vide ('') = l'élément correspondant est masqué.
   ========================================================== */
window.SOSIJI = {
  // Lien de la page de commande (Uber Eats, etc.) → boutons « Commander »
  orderUrl: '',

  // Lien du compte Instagram, ex. 'https://www.instagram.com/sosiji...'
  instagramUrl: '',

  // Adresse complète
  address: 'Place du Traité-de-Turin 3, 1226 Thônex',

  // Contact
  phone: '076 288 16 13',
  email: '',

  // Horaires — dow = jours de la semaine (0 = dimanche, 1 = lundi … 6 = samedi)
  // slots vide = fermé
  hours: [
    { days: 'Lundi', dow: [1], slots: [] },
    { days: 'Mardi – Vendredi', dow: [2, 3, 4, 5], slots: ['11:30–14:00', '18:30–22:00'] },
    { days: 'Samedi', dow: [6], slots: ['18:00–22:00'] },
    { days: 'Dimanche', dow: [0], slots: ['18:00–21:30'] },
  ],

  // Bandeau d'annonce en haut du site (plat du moment, fermeture, menu spécial…)
  // Laisser vide pour le masquer.
  announcement: '',

  // Mentions légales (obligatoire en Suisse)
  legal: {
    company: '',   // raison sociale, ex. 'Sosiji Sàrl'
    owner: '',     // responsable du site
    ide: '',       // numéro IDE, ex. 'CHE-123.456.789' (si inscrit au RC)
  },
};
