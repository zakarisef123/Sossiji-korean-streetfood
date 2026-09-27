#!/usr/bin/env python3
"""Génère en.html (version anglaise) à partir de index.html.

Après chaque modification de texte dans index.html, lancez :
    python3 tools/build-en.py

Si une phrase française a changé et n'a plus de traduction, le script
s'arrête et indique laquelle : ajoutez / corrigez la paire ci-dessous.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent

# (français, anglais) — chaque texte français doit exister dans index.html
PAIRS = [
    # ---- <head> ----
    ('<html lang="fr">', '<html lang="en">'),
    ('<meta name="description" content="Sosiji, Korean streetfood : Crousty Chikin Bowl, poulet frit coréen, bibimbap et kimchi dogs. Place du Traité-de-Turin 3, Thônex. Ouvert du mardi au dimanche.">',
     '<meta name="description" content="Sosiji, Korean street food in Thônex (Geneva): Crousty Chikin Bowl, Korean fried chicken, bibimbap and kimchi dogs. Place du Traité-de-Turin 3. Open Tuesday to Sunday.">'),
    ('<meta property="og:description" content="Crousty Chikin Bowl, poulet frit au gochujang, bibimbap et kimchi dogs. Le goût de Séoul, version street.">',
     '<meta property="og:description" content="Crousty Chikin Bowl, gochujang fried chicken, bibimbap and kimchi dogs. The taste of Seoul, street style.">'),
    ('<meta property="og:url" content="https://sosiji.netlify.app/">', '<meta property="og:url" content="https://sosiji.netlify.app/en">'),
    ('<meta property="og:locale" content="fr_CH">', '<meta property="og:locale" content="en_GB">'),
    ('<link rel="canonical" href="https://sosiji.netlify.app/">', '<link rel="canonical" href="https://sosiji.netlify.app/en">'),

    # ---- intro / nav ----
    ('cliquez pour entrer · 들어오세요', 'click to come in · 들어오세요'),
    ('aria-label="Sosiji — accueil"', 'aria-label="Sosiji — home"'),
    ('aria-label="Ouvrir le menu"', 'aria-label="Open the menu"'),
    ('aria-label="Navigation principale"', 'aria-label="Main navigation"'),
    ('<a href="#histoire">Histoire <span class="ko">이야기</span></a>', '<a href="#histoire">Story <span class="ko">이야기</span></a>'),
    ('<a href="#seoul">Séoul <span class="ko">서울</span></a>', '<a href="#seoul">Seoul <span class="ko">서울</span></a>'),
    ('<a href="#infos">Infos <span class="ko">정보</span></a>', '<a href="#infos">Info <span class="ko">정보</span></a>'),
    ('<a class="nav__lang" href="en" hreflang="en" lang="en" aria-label="English version">EN</a>',
     '<a class="nav__lang" href="./" hreflang="fr" lang="fr" aria-label="Version française">FR</a>'),
    ('rel="noopener">Livraison 🛵</a>', 'rel="noopener">Delivery 🛵</a>'),
    ('hidden>🛒 Commander</button>', 'hidden>🛒 Order</button>'),

    # ---- hero ----
    ('</span> · Bienvenue</p>', '</span> · Welcome</p>'),
    ('<span class="line">Le goût</span>', '<span class="line">The taste</span>'),
    ('<span class="line">de <em>Séoul</em>,</span>', '<span class="line">of <em>Seoul</em>,</span>'),
    ('<span class="line outline">version street.</span>', '<span class="line outline">street style.</span>'),
    ("Crousty Chikin Bowl, poulet frit au gochujang, bibimbap et kimchi dogs. Comme dans les ruelles de Myeongdong — sans prendre l'avion.",
     'Crousty Chikin Bowl, gochujang fried chicken, bibimbap and kimchi dogs. Just like the back streets of Myeongdong — no flight needed.'),
    ('hidden>Commander à emporter <span class="ko">포장</span></a>', 'hidden>Order for pickup <span class="ko">포장</span></a>'),
    ('<a href="#menu" class="btn">Voir le menu</a>', '<a href="#menu" class="btn">See the menu</a>'),
    ('rel="noopener">Livraison Uber Eats 🛵</a>', 'rel="noopener">Uber Eats delivery 🛵</a>'),
    ('alt="Kimchi Dog : saucisse de volaille, kimchi maison et mayo au gochujang"', 'alt="Kimchi Dog: chicken sausage, homemade kimchi and gochujang mayo"'),
    ('aria-label="Hot-dogs dès 6 francs 50"', 'aria-label="Hot-dogs from 6.50 francs"'),
    ('<small>DÈS CHF</small>', '<small>FROM CHF</small>'),

    # ---- tapes ----
    ('POULET FRIT ✦', 'FRIED CHICKEN ✦'),

    # ---- menu ----
    ("<h2>Ce qu'on sert <span class=\"ko\">맛있어요!</span></h2>", '<h2>What we serve <span class="ko">맛있어요!</span></h2>'),
    ('<p>Poulet frit, bibimbap, kimchi dogs… des classiques coréens faits maison. Midi et soir du mardi au vendredi, le soir le week-end.</p>',
     '<p>Fried chicken, bibimbap, kimchi dogs… homemade Korean classics. Lunch and dinner Tuesday to Friday, dinner on weekends.</p>'),
    ('<span>🌶️ épicé</span><span>🌱 végétarien</span>', '<span>🌶️ spicy</span><span>🌱 vegetarian</span>'),
    ('alt="Crousty Chikin Bowl : riz, poulet croustillant et sauces"', 'alt="Crousty Chikin Bowl: rice, crispy chicken and sauces"'),
    ("<p>Le bol généreux qui met tout le monde d'accord : une base de riz, du poulet ultra croustillant et ses sauces.</p>",
     '<p>The generous bowl everyone agrees on: a rice base, extra-crispy chicken and its sauces.</p>'),
    ('data-switch="Poulet frit"', 'data-switch="Fried chicken"'),
    ('alt="Poulet frit Traditional" loading="lazy"><span class="card__label">', 'alt="Fried chicken Traditional" loading="lazy"><span class="card__label">'),
    ('<h3>Poulet frit</h3>', '<h3>Fried chicken</h3>'),
    ('Choisissez votre sauce 👇', 'Pick your sauce 👇'),
    ('title="Épicé"', 'title="Spicy"'),
    ('<small>Recette authentique, légèrement épicée au gochujang</small>', '<small>The authentic recipe, lightly spiced with gochujang</small>'),
    ('<small>Sauce soja sucrée et ail, tout simplement !</small>', '<small>Sweet soy sauce and garlic, simple as that!</small>'),
    ('<small>Lait de coco, curry et une petite touche acidulée</small>', '<small>Coconut milk, curry and a zesty touch</small>'),
    ('alt="Bibimbap Bœuf" loading="lazy"><span class="card__label">Bœuf</span>', 'alt="Beef bibimbap" loading="lazy"><span class="card__label">Beef</span>'),
    ("<p>L'icône de la cuisine coréenne 🇰🇷</p>", '<p>The icon of Korean cuisine 🇰🇷</p>'),
    ('Bœuf ou tofu ? 👇', 'Beef or tofu? 👇'),
    ('<span>Bœuf</span><b data-price="bibimbap-boeuf">', '<span>Beef</span><b data-price="bibimbap-boeuf">'),
    ('title="Végétarien">🌱</i><small>Végétarien</small>', 'title="Vegetarian">🌱</i><small>Vegetarian</small>'),
    ('alt="Hot-dog Classique" loading="lazy"><span class="card__label">Classique</span>', 'alt="Classic hot-dog" loading="lazy"><span class="card__label">Classic</span>'),
    ('Choisissez votre dog 👇', 'Pick your dog 👇'),
    ('<span>Classique <small>Saucisse de volaille, ketchup, moutarde douce, oignons frits et relish maison</small>',
     '<span>Classic <small>Chicken sausage, ketchup, mild mustard, crispy onions and homemade relish</small>'),
    ('<small>Saucisse de volaille, kimchi maison, mayo au gochujang et cébettes</small>',
     '<small>Chicken sausage, homemade kimchi, gochujang mayo and spring onions</small>'),
    ('alt="Frites maison" loading="lazy"><span>Frites maison</span>', 'alt="Homemade fries" loading="lazy"><span>Homemade fries</span>'),
    ('alt="Riz blanc" loading="lazy"><span>Riz blanc</span>', 'alt="White rice" loading="lazy"><span>White rice</span>'),
    ('alt="Eau minérale Henniez"', 'alt="Henniez mineral water"'),
    ('<span>Eau minérale plate <small>', '<span>Still mineral water <small>'),
    ('<span>Eau minérale gazeuse <small>', '<span>Sparkling mineral water <small>'),
    ('<h3><span class="ko">술</span> Alcools</h3>', '<h3><span class="ko">술</span> Alcohol</h3>'),
    ('alt="Bière Asahi Super Dry" loading="lazy"><span>Bière Asahi <small>', 'alt="Asahi Super Dry beer" loading="lazy"><span>Asahi beer <small>'),
    ('Prix en CHF, TVA incluse · Informations sur les allergènes sur demande.', 'Prices in CHF, VAT included · Allergen information on request.'),
    ('Plutôt en livraison ? Uber Eats 🛵', 'Prefer delivery? Uber Eats 🛵'),

    # ---- histoire ----
    ('aria-label="Sceau coréen : 맛집 인증, restaurant approuvé"', 'aria-label="Korean seal: 맛집 인증, approved restaurant"'),
    ('이야기 · Notre histoire', '이야기 · Our story'),
    ('<span>= saucisse.</span>', '<span>= sausage.</span>'),
    ("<p>« Sosiji », c'est le mot coréen pour <strong>saucisse</strong>. Un clin d'œil aux stands de rue de Séoul, où l'on croque un hot-dog entre deux néons, la K-pop à fond dans les enceintes.</p>",
     '<p>“Sosiji” is the Korean word for <strong>sausage</strong>. A nod to the street stalls of Seoul, where you grab a hot-dog between two neon signs with K-pop blasting from the speakers.</p>'),
    ("<p>Chez nous, c'est la même énergie : des recettes coréennes généreuses, des sauces qui piquent juste ce qu'il faut, et une ambiance qui fait voyager.</p>",
     '<p>Same energy here: generous Korean recipes, sauces with just the right kick, and a vibe that takes you travelling.</p>'),
    ('<li>🍗 Double friture</li>', '<li>🍗 Double fried</li>'),
    ('<li>🔥 Fait minute</li>', '<li>🔥 Made to order</li>'),

    # ---- séoul ----
    ('<h2>Un petit bout de Corée</h2>', '<h2>A little piece of Korea</h2>'),
    ("<p>La cuisine de rue fait partie de l'âme de la Corée. Voici ce qui nous inspire.</p>",
     "<p>Street food is part of Korea's soul. Here's what inspires us.</p>"),
    ("<p>Les tentes orange de Séoul où l'on mange tard dans la nuit, au coude à coude.</p>",
     "<p>Seoul's orange tents where people eat late into the night, shoulder to shoulder.</p>"),
    ('<p>Couleurs flashy, énergie à 200 % et playlists qui tournent en boucle en cuisine.</p>',
     '<p>Flashy colours, 200% energy and playlists on repeat in the kitchen.</p>'),
    ('<p>Le quartier des stands de street food : hot-dogs, brochettes et poulet frit à chaque coin.</p>',
     '<p>The street food district: hot-dogs, skewers and fried chicken on every corner.</p>'),
    ('<p>Chi(킨) + maek(주) : poulet frit + bière, le duo culte des soirées coréennes.</p>',
     '<p>Chi(킨) + maek(주): fried chicken + beer, the cult duo of Korean nights out.</p>'),
    ('Mini cours de coréen ✦', 'Mini Korean lesson ✦'),
    ('aria-label="Écouter 안녕하세요"', 'aria-label="Listen to 안녕하세요"'),
    ('aria-label="Écouter 맛있어요"', 'aria-label="Listen to 맛있어요"'),
    ('aria-label="Écouter 감사합니다"', 'aria-label="Listen to 감사합니다"'),
    ('annyeonghaseyo — bonjour', 'annyeonghaseyo — hello'),
    ("masisseoyo — c'est délicieux", "masisseoyo — it's delicious"),
    ('gamsahamnida — merci', 'gamsahamnida — thank you'),

    # ---- galerie ----
    ('갤러리 · Galerie', '갤러리 · Gallery'),
    ('<h2>Ça donne faim, non ?</h2>', '<h2>Hungry yet?</h2>'),
    ('alt="Poulet frit Traditional" loading="lazy"></figure>', 'alt="Fried chicken Traditional" loading="lazy"></figure>'),
    ('alt="Bibimbap au bœuf"', 'alt="Beef bibimbap"'),
    ('alt="Poulet frit Lime Coco Curry"', 'alt="Fried chicken Lime Coco Curry"'),
    ('alt="Bibimbap au tofu"', 'alt="Tofu bibimbap"'),
    ('alt="Hot-dog Classique" loading="lazy"></figure>', 'alt="Classic hot-dog" loading="lazy"></figure>'),
    ('Suivez-nous sur Instagram', 'Follow us on Instagram'),

    # ---- infos ----
    ('오시는 길 · Nous trouver', '오시는 길 · Find us'),
    ('<h2>Passez nous voir</h2>', '<h2>Come and see us</h2>'),
    ('<h3>📍 Adresse</h3>', '<h3>📍 Address</h3>'),
    ('Itinéraire →', 'Directions →'),
    ('<h3>🕐 Horaires <span', '<h3>🕐 Opening hours <span'),
    ('<h3>🛵 Commander</h3>', '<h3>🛵 Order</h3>'),
    ('hidden>À emporter</button>', 'hidden>Pickup</button>'),
    ('rel="noopener">Livraison Uber Eats</a>', 'rel="noopener">Uber Eats delivery</a>'),
    ('title="Carte : Sosiji Korean Streetfood"', 'title="Map: Sosiji Korean Streetfood"'),

    # ---- footer ----
    ('Korean Streetfood · Fait avec ♥ et beaucoup de gochujang', 'Korean Streetfood · Made with ♥ and lots of gochujang'),
    ('aria-label="Liens"', 'aria-label="Links"'),
    ('<a href="mentions-legales.html">Mentions légales</a>', '<a href="mentions-legales.html" hreflang="fr">Legal notice (FR)</a>'),
    ('<a href="mentions-legales.html#confidentialite">Confidentialité</a>', '<a href="mentions-legales.html#confidentialite" hreflang="fr">Privacy (FR)</a>'),

    # ---- panier ----
    ('aria-label="Ouvrir le panier"', 'aria-label="Open the cart"'),
    ('<span class="cart-fab__label">Panier <span class="ko">', '<span class="cart-fab__label">Cart <span class="ko">'),
    ('<aside class="cart" aria-label="Panier"', '<aside class="cart" aria-label="Cart"'),
    ('<h2><span class="ko">장바구니</span> Panier</h2>', '<h2><span class="ko">장바구니</span> Cart</h2>'),
    ('aria-label="Fermer le panier"', 'aria-label="Close the cart"'),
    ('Votre panier est vide. Ajoutez des plats avec les boutons <b>+</b> du menu.', 'Your cart is empty. Add dishes with the <b>+</b> buttons in the menu.'),
    ('<span>Heure de retrait <span class="req">', '<span>Pickup time <span class="req">'),
    ('<span>Prénom <span class="req">', '<span>First name <span class="req">'),
    ('<span>Téléphone <span class="req">', '<span>Phone <span class="req">'),
    ('<span>Remarque <small>(allergie, sans oignons…)</small></span>', '<span>Note <small>(allergy, no onions…)</small></span>'),
    ("J'ai 16 ans ou plus (bière) — une pièce d'identité peut être demandée au retrait.", "I'm 16 or older (beer) — ID may be requested at pickup."),
    ('type="submit">Payer</button>', 'type="submit">Pay</button>'),
    ('À emporter : Place du Traité-de-Turin 3, Thônex. Paiement sécurisé par Stripe : TWINT, carte, Apple Pay, Google Pay.',
     'Pickup at Place du Traité-de-Turin 3, Thônex. Secure payment by Stripe: TWINT, card, Apple Pay, Google Pay.'),
]

# « Ajouter X au panier » → « Add X to cart » (un par produit)
ADD_LABELS = {
    'Crousty Chikin Bowl': 'Crousty Chikin Bowl', 'Poulet frit Traditional': 'Fried chicken Traditional',
    'Poulet frit Sojail': 'Fried chicken Sojail', 'Poulet frit Lime Coco Curry': 'Fried chicken Lime Coco Curry',
    'Bibimbap bœuf': 'Beef bibimbap', 'Bibimbap tofu': 'Tofu bibimbap', 'Hot-dog Classique': 'Classic hot-dog',
    'Kimchi Dog': 'Kimchi Dog', 'Frites maison': 'Homemade fries', 'Riz blanc': 'White rice',
    'Eau minérale plate': 'Still mineral water', 'Eau minérale gazeuse': 'Sparkling mineral water',
    'OISHI Green Tea Honey Lemon': 'OISHI Green Tea Honey Lemon', 'OISHI Green Tea Original': 'OISHI Green Tea Original',
    'Bière Asahi': 'Asahi beer',
}


def main():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    missing = []
    for fr, en in PAIRS:
        if fr not in html:
            missing.append(fr)
        html = html.replace(fr, en)
    for fr, en in ADD_LABELS.items():
        needle = f'aria-label="Ajouter {fr} au panier"'
        if needle not in html:
            missing.append(needle)
        html = html.replace(needle, f'aria-label="Add {en} to cart"')
    if missing:
        print('Traductions manquantes (texte introuvable dans index.html) :', file=sys.stderr)
        for m in missing:
            print('  -', m[:120], file=sys.stderr)
        sys.exit(1)
    note = '<!-- Fichier généré par tools/build-en.py depuis index.html : ne pas modifier à la main. -->'
    html = html.replace('<!doctype html>', '<!doctype html>\n' + note, 1)
    (ROOT / 'en.html').write_text(html, encoding='utf-8')
    print('en.html généré.')


if __name__ == '__main__':
    main()
