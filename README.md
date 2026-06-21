# Fêtes de Luglon — Site officiel

Site web du Comité des Fêtes de Luglon : programme des animations et réservation en ligne des repas pour l'édition 2026.

**Site en ligne :** voir le fichier `CNAME` pour le domaine configuré.

---

## 🧱 Stack technique

Le site est **100% statique** (HTML / CSS / JavaScript vanilla, sans framework ni build), hébergé sur **GitHub Pages**.

La seule brique "backend" est un script **Google Apps Script** connecté à un Google Sheet, qui :
- enregistre chaque réservation dans un onglet dédié (un onglet par soir),
- envoie un e-mail de confirmation avec récapitulatif + fichier `.ics` à joindre au calendrier.

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
├── styles.css                      # Feuille de style unique, partagée par toutes les pages
│
├── script.js                       # Logique du formulaire de réservation
├── confirmation.js                 # Logique de la page de confirmation
├── countdown.js                    # Compte à rebours avant clôture des réservations
├── calendar-export.js              # Génération des fichiers .ics (page Programme)
├── scroll-animations.js            # Animations au scroll (IntersectionObserver)
│
├── images/                         # Logos, illustrations, photos
├── fonts/                          # Polices hébergées en local (self-hosted)
│   ├── fascinate-inline.woff2
│   ├── slackey.woff2
│   └── special-gothic-condensed-one.woff2
├── favicon.png
├── CNAME                           # Domaine personnalisé (GitHub Pages)
└── todo.me                         # Notes de suivi personnelles
```

> ℹ️ Le script Google Apps Script (`Code.gs`) ne vit pas dans ce dépôt : il est géré directement dans l'éditeur Apps Script lié au Google Sheet. Une copie de référence est conservée séparément pour le suivi des versions.

---

## ⚙️ Fonctionnalités principales

### Page d'accueil
Présentation générale + compte à rebours avant la clôture des réservations.

### Page Programme
- Détail des animations, jour par jour (jeudi → dimanche)
- Bouton **« Ajouter au calendrier »** par jour : génère et télécharge un fichier `.ics` (compatible Google Calendar, Apple Calendar, Outlook…), sans dépendance externe

### Page Réservation
- Formulaire avec calcul du prix en temps réel selon le soir, le nombre de personnes et le menu choisi par personne
- **Détection de double réservation** : si l'utilisateur a déjà réservé pour un soir donné (sur le même appareil), une modale d'avertissement s'affiche avant de pouvoir valider une seconde fois
- **Modale de récapitulatif** avant envoi final (jour, horaire, lieu, détail des menus, contact, total)
- Envoi des données au script Google Apps Script, qui écrit dans le Google Sheet et envoie l'e-mail de confirmation
- **Compte à rebours** avec blocage automatique du formulaire après la date de clôture (remplacé par un message invitant à contacter le Comité directement)

### Page Confirmation
Récapitulatif complet de la réservation qui vient d'être effectuée, avec suggestion de réserver l'autre soir si ce n'est pas déjà fait.

### E-mail de confirmation (Apps Script)
- Mise en page HTML soignée, couleurs de la charte du site
- Encart avec horaire, lieu et lien cliquable vers l'itinéraire (Google Maps / Apple Plans)
- Fichier `.ics` joint pour ajouter directement le repas au calendrier

---

## 🔧 Configuration nécessaire

### `script.js`
```js
const WEB_APP_URL = 'https://script.google.com/macros/s/XXXXX/exec';
```
URL du déploiement Apps Script. À mettre à jour si le script est redéployé (chaque redéploiement en "nouvelle version" change l'URL).

### `countdown.js`
```js
const RESERVATION_DEADLINE = new Date('2026-07-28T23:59:59');
```
Date et heure de clôture des réservations, à ajuster selon l'édition.

### `calendar-export.js` / `Code.gs`
Dates, horaires et lieux des événements (`EVENT_INFO_BY_DAY` / `EVENTS`) à mettre à jour chaque année avec le nouveau programme.

### Tarifs
Définis dans **trois fichiers distincts à garder synchronisés** :
- `script.js` (`PRICES_BY_DAY`)
- `confirmation.js` (`PRICES_BY_DAY`)
- Affichage HTML dans `reservation/index.html` (tableau des tarifs) et `programme/index.html` (texte des repas)

---

## 🚀 Déploiement

Le site est servi directement par **GitHub Pages** depuis la branche `main` — aucune étape de build n'est nécessaire, un simple push suffit.

**Workflow recommandé pour tester une modification avant mise en production :**
```bash
git checkout -b nom-de-la-branche-test
# ... modifications ...
git add .
git commit -m "Description du changement"
git push origin nom-de-la-branche-test
```
Tester en local en ouvrant les fichiers directement dans un navigateur, ou via un petit serveur local :
```bash
python3 -m http.server 8000
```

### Mise à jour du script Apps Script
Le fichier `Code.gs` ne se déploie pas via Git : toute modification doit être copiée manuellement dans l'éditeur Apps Script (lié au Google Sheet), puis **redéployée** :
`Déployer → Gérer les déploiements → Modifier → Nouvelle version`.

---

## 📌 Points de vigilance / à finaliser

- **Mentions légales / politique de confidentialité** : à rédiger et publier sur le site (actuellement absentes).
- **Stockage des réservations côté client** : la détection de double réservation et l'affichage "dernières réservations" reposent sur le `localStorage` du navigateur — cela ne fonctionne que par appareil, pas de vue d'ensemble multi-appareils côté visiteur.
- **Lien Google Maps** dans l'e-mail de confirmation basé sur une recherche textuelle (`"Salle des fêtes, Luglon"`) plutôt que des coordonnées GPS exactes — à vérifier que le lien pointe bien sur le bon lieu.

---

## 📞 Contact

**Comité des Fêtes de Luglon**
- E-mail : contact@cdf-luglon.fr
- Instagram : [@cdfluglon](https://www.instagram.com/cdfluglon/)
- Facebook : Comité des fêtes de Luglon
