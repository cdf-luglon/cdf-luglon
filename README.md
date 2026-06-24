# Fêtes de Luglon — Site officiel

Site web du Comité des Fêtes de Luglon : programme des animations et réservation en ligne des repas pour l'édition 2026.

**Site en ligne :** [cdf-luglon.fr](https://cdf-luglon.fr)

---

## 🧱 Stack technique

Le site est **100% statique** (HTML / CSS / JavaScript vanilla, sans framework ni build), hébergé sur **GitHub Pages**.

La seule brique "backend" est un script **Google Apps Script** connecté à un Google Sheet, qui :
- vérifie si un numéro de téléphone a déjà réservé pour un soir donné (tous appareils confondus),
- enregistre chaque réservation dans un onglet dédié (un onglet par soir),
- envoie un e-mail de confirmation HTML avec récapitulatif + fichier `.ics` en pièce jointe.

Aucune base de données, aucun serveur à maintenir.

---

## 📁 Structure du projet

```
cdf-luglon/
├── index.html                      # Page d'accueil
├── programme/
│   └── index.html                  # Programme détaillé jour par jour (jeu→dim)
├── reservation/
│   ├── index.html                  # Formulaire de réservation des repas
│   └── confirmation/
│       └── index.html              # Page affichée après une réservation réussie
│
├── confidentialite/
│   └── index.html                  # Politique de confidentialité (RGPD)
│
├── styles.css                      # Feuille de style unique, partagée par toutes les pages
│
├── config.js                       # Configuration partagée (tarifs, menus, infos repas)
├── script.js                       # Logique complète du formulaire de réservation
├── confirmation.js                 # Logique de la page de confirmation post-réservation
├── countdown.js                    # Compte à rebours + blocage formulaire après clôture
├── calendar-export.js              # Génération des fichiers .ics (page Programme)
├── scroll-animations.js            # Animations au scroll (IntersectionObserver)
│
├── fonts/                          # Polices self-hosted (RGPD — plus d'appel Google Fonts)
│   ├── fascinate-inline.woff2
│   ├── slackey.woff2
│   └── special-gothic-condensed-one.woff2
│
├── images/
│   ├── logo_cdf.jpg                # Logo utilisé dans le header du site
│   ├── logo_google.jpg             # Logo fond blanc pour Google Search / Open Graph
│   └── ...                         # Autres assets visuels
│
├── favicon.png                     # Favicon carré 192×192 (multiple de 48, optimisée ~34 Ko)
├── robots.txt                      # Indique le sitemap aux moteurs de recherche
├── sitemap.xml                     # Plan du site (pages à indexer)
└── CNAME                           # Domaine personnalisé (GitHub Pages)
```

> Le script Google Apps Script (`Code.gs`) ne vit pas dans ce dépôt : il est géré directement dans l'éditeur Apps Script lié au Google Sheet. Conserver une copie locale à jour pour le suivi des versions.

---

## ⚙️ Fonctionnalités

### Page d'accueil
- Présentation générale des fêtes
- **Compte à rebours** avant la clôture des réservations (bordure orange, chiffres animés, passage en mode "urgent" dans les dernières 48h)

### Page Programme
- Détail des animations jour par jour (jeudi → dimanche)
- **Bouton « Ajouter au calendrier »** par jour : génère et télécharge un fichier `.ics` (compatible Google Calendar, Apple Calendar, Outlook), sans dépendance externe ni serveur

### Page Réservation
- Formulaire avec calcul du prix en **temps réel** (soir × menu × nombre de personnes)
- **Détection de doublon en 2 niveaux** :
  1. `localStorage` (instantané, cet appareil) — si une réservation existe déjà pour ce soir, modale d'avertissement avec récap
  2. Serveur via JSONP → Apps Script → Google Sheet (tous appareils) — si le numéro de téléphone a déjà réservé ce soir depuis n'importe quel appareil, même modale d'avertissement. Timeout de 4 secondes : si le serveur ne répond pas, le flux continue normalement sans bloquer
- **Modale de récapitulatif** avant tout envoi : jour, horaire, lieu, détail des menus par personne, coordonnées, total à régler sur place — l'utilisateur confirme explicitement avant l'envoi réel
- Blocage automatique du formulaire après la **date de clôture** (message avec contacts Félix et Tiphaine)
- Historique des réservations effectuées sur cet appareil (via `localStorage`), avec horodatage figé au moment réel de la réservation

### Page Confirmation
- Récapitulatif complet de la réservation qui vient d'être effectuée
- Message contextuel si l'autre soir n'est pas encore réservé ("pensez à réserver aussi le samedi")
- Gestion du cas où la page est visitée directement sans avoir réservé ("aucune réservation récente trouvée")

### E-mail de confirmation (Apps Script)
- Mise en page HTML avec couleurs de la charte (vert Luglon `#166136`)
- Encart vert avec jour, horaire et **lien cliquable vers l'itinéraire** (Google Maps / Apple Plans)
- Tableau des menus (uniquement les lignes non nulles), total mis en avant
- **Fichier `.ics` en pièce jointe** : un clic suffit pour ajouter le repas au calendrier

### SEO / Référencement
- Balises `<meta description>` et `<link rel="canonical">` sur chaque page
- **Open Graph** : contrôle de l'image et du texte lors des partages (WhatsApp, Facebook, etc.)
- **JSON-LD structuré** : `Organization` (nom, logo, réseaux sociaux) + `EventSeries` + 4 `Event` individuels avec dates, lieux et tarifs — permet l'affichage de résultats enrichis dans Google
- Polices hébergées en local (self-hosted via Fontsource/npm) : aucun appel tiers à Google Fonts, conformité RGPD de base assurée

---

## 🔧 Configuration à mettre à jour chaque année

### `script.js` — URL du déploiement Apps Script
```js
const WEB_APP_URL = 'https://script.google.com/macros/s/XXXXX/exec';
```
À mettre à jour si le script Apps Script est redéployé en nouvelle version (l'URL change à chaque nouveau déploiement).

### `countdown.js` — Date de clôture des réservations
```js
const RESERVATION_DEADLINE = new Date('2026-07-28T23:59:59');
```

### `config.js` — Tarifs (source unique pour le code)
```js
window.LUGLON = {
  PRICES_BY_DAY: {
    'vendredi': { 'standard': 14.00, 'poisson': 14.00, 'enfant': 7.00 },
    'samedi':   { 'standard': 16.00, 'poisson': 16.00, 'enfant': 8.00 }
  },
  ...
};
```
> Les tarifs utilisés par le **calcul** (formulaire + page de confirmation) sont
> désormais définis **une seule fois** dans `config.js` ; `script.js` et
> `confirmation.js` les lisent depuis là.
>
> ⚠️ Restent à mettre à jour **à la main** (texte en dur, pas du calcul) :
> - `reservation/index.html` — tableau des tarifs affiché
> - `programme/index.html` — texte des repas avec tarifs
> - les blocs JSON-LD (`index.html`, `programme/index.html`) — prix des `Offer`

### `calendar-export.js` — Événements par jour (page Programme)
```js
const EVENTS = { jeudi: {...}, vendredi: {...}, samedi: {...}, dimanche: {...} }
```

### `script.js` — Infos pratiques repas (modale récapitulatif)
```js
const EVENT_INFO_BY_DAY = {
    'vendredi': { label: '...', time: '20h00', location: '...' },
    'samedi':   { label: '...', time: '20h00', location: '...' }
}
```

### `Code.gs` — Infos pratiques repas (e-mail + .ics)
```js
const EVENT_INFO_BY_DAY = {
    "vendredi": { label: '...', time: '...', location: '...', start: [...], end: [...] },
    "samedi":   { label: '...', time: '...', location: '...', start: [...], end: [...] }
}
```

### JSON-LD (`index.html` et `programme/index.html`)
Mettre à jour les dates, descriptions et tarifs dans les blocs `<script type="application/ld+json">`.

---

## 🚀 Déploiement

Le site est servi directement par **GitHub Pages** depuis la branche `main` — aucune étape de build, un simple push suffit.

### Workflow recommandé (test avant merge)
```bash
# Créer une branche de test
git checkout -b nom-de-la-branche-test

# Modifier, puis :
git add .
git commit -m "Description du changement"
git push origin nom-de-la-branche-test

# Tester en local
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

### Vider le localStorage pendant les tests (console navigateur)
```js
localStorage.removeItem('luglon_reservations')
localStorage.removeItem('luglon_last_reservation_timestamp')
```
Ou en navigation privée (`Cmd+Maj+N`) pour repartir d'un état vierge à chaque test.

Sur Safari, activer d'abord le menu Développement : **Safari → Réglages → Avancé → Afficher les fonctionnalités pour les développeurs web**, puis `Cmd+Option+C` pour ouvrir la console.

### Mise à jour du script Apps Script
`Code.gs` ne se déploie pas via Git. Toute modification doit être :
1. Copiée manuellement dans l'éditeur Apps Script (lié au Google Sheet)
2. **Redéployée** : `Déployer → Gérer les déploiements → Modifier → Nouvelle version`

> La vérification anti-doublon côté serveur (`doGet`) n'est active qu'après redéploiement en nouvelle version. Une simple sauvegarde du code ne suffit pas.

---

## 📌 Points de vigilance

- **Politique de confidentialité** : publiée sur `/confidentialite/` (RGPD). Des **mentions légales** complètes (identité de l'association, hébergeur) peuvent encore être ajoutées si besoin.
- **Confirmation d'envoi non garantie** : l'envoi de la réservation se fait en `fetch` `mode: 'no-cors'` ([script.js](script.js), `submitReservation`). Le navigateur ne peut pas lire la réponse de Google : on affiche « confirmée » dès que la requête part, sans vérifier que le Sheet a bien enregistré. Pour une vraie confirmation, il faudrait passer l'envoi en **JSONP** (comme le check anti-doublon) **et** adapter `Code.gs` côté serveur. Non fait ici car cela nécessite un redéploiement coordonné du script Apps Script.
- **Détection doublon `localStorage`** : ne fonctionne que sur le même appareil/navigateur. La vérification serveur (téléphone + soir) couvre les autres cas, mais avec un timeout de 4 secondes — si Apps Script est en veille froide, la première requête peut ne pas aboutir.
- **Sitelinks Google** (sous-liens Programme/Réservation dans les résultats) : non contrôlables, affichés à la discrétion de Google selon le trafic et l'ancienneté du site.

---

## 📞 Contact

**Comité des Fêtes de Luglon**
- E-mail : contact@cdf-luglon.fr
- Instagram : [@cdfluglon](https://www.instagram.com/cdfluglon/)
- Facebook : [Comité des fêtes de Luglon](https://www.facebook.com/p/Comit%C3%A9-des-f%C3%AAtes-de-Luglon-100083680651271/)
