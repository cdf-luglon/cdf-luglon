# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📋 Project Overview

**Comité des Fêtes de Luglon** — Official website of the village committee (association loi 1901) in Luglon, France.

- **Tech stack**: 100% static (HTML/CSS/vanilla JavaScript), hosted on GitHub Pages
- **No build process**: Direct push to `main` branch deploys the site
- **Backend**: Google Apps Script + Google Sheets (reservation validation, duplicate detection, email confirmations)
- **Nav (5 tabs)**: Accueil · Évènements · Le Comité · Galerie · Contact
  — "Évènements" carries a dropdown submenu, one entry per event page

> **August 2026 — scope change.** The site used to be a single-event site
> ("Fêtes de Luglon 2026") with an Accueil / Programme / Réservation nav. Now the
> summer fête is *one event among several* (belote, carnaval, …) run by a
> year-round association. The old `/programme/` page is a noindex redirect to
> `/evenements/fetes-de-luglon/`, which holds the archived 2026 programme —
> **do not delete it**, that URL was shared on Facebook and in confirmation emails.

---

## 🚀 Development

### Starting a local web server
```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

No build step, no compilation — changes are live immediately in the browser.

### Testing with a clean state
Clear local storage in the browser console to reset all cached reservations:
```js
localStorage.removeItem('luglon_reservations')
localStorage.removeItem('luglon_last_reservation_timestamp')
```

Or use **private browsing mode** to start fresh each session.

On Safari, enable the Develop menu first: **Safari → Settings → Advanced → Show features for web developers**, then `Cmd+Option+C` to open the console.

### Git Workflow
The site deploys automatically from the `main` branch — any push to `main` goes live immediately.

**Recommended workflow for changes:**
```bash
# Create a feature/test branch (avoid committing directly to main)
git checkout -b feature-name

# Make changes, test locally (python3 -m http.server 8000)
# Then commit and push to your branch
git add .
git commit -m "Description of what changed"
git push origin feature-name

# Create a pull request on GitHub to review changes
# After review, merge to main — site deploys automatically
```

**Before committing:**
- Test changes locally with `python3 -m http.server 8000`
- Clear localStorage if testing the reservation form multiple times
- Verify no accidental API keys or sensitive data in commits (check `git diff` before staging)

---

## 📁 File Organization

### Pages

| File | Purpose |
|------|---------|
| **index.html** | Homepage: what the committee is, teaser of the 3 main events, volunteer CTA. |
| **evenements/index.html** | Event list — one `.event-card` per event. **The source of truth for event content.** |
| **evenements/fetes-de-luglon/index.html** | The summer fête: next edition, reservation link, and the archived 2026 programme. |
| **evenements/concours-de-belote/index.html** | Winter card tournament. Placeholder dates. |
| **evenements/carnaval/index.html** | Spring costume parade. Placeholder dates. |
| **comite/index.html** | The association: mission, three principles, bureau members, how to join. |
| **galerie/index.html** | Photo gallery — alternating left/right flow, click-to-enlarge. Currently uses **example images from `images/`**, clearly captioned as such; swap in real photos. |
| **contact/index.html** | Email, socials, postal address, and "before you write" notes. |
| **programme/index.html** | **Redirect stub only** (noindex → `/evenements/fetes-de-luglon/`). Keep it. |
| **reservation/index.html** | Reservation form: day/menu/attendees selection, real-time total, validation. |
| **reservation/confirmation/index.html** | Confirmation page shown after successful submission. |
| **confidentialite/**, **mentions-legales/** | GDPR privacy policy and legal notice. |

### Scripts

| File | Purpose |
|------|---------|
| **styles.css** | Single shared stylesheet for all pages. Read the two rules at the top before editing. |
| **nav.js** | Nav bar: scrolled state (IntersectionObserver, no scroll listener) + mobile panel. On every page. |
| **scroll-animations.js** | Reveal-on-scroll. Only shared selector with the CSS is `[data-reveal]`. On every page. |
| **events.js** | Reads each `.event-card[data-date]` and sets its badge to "À venir" / "Terminé". Fail-open. |
| **rail-dots.js** | Snap-scroll carousel dots. Hooks: `#day-rail`/`#day-dots`, `#galerie-rail`/`#galerie-dots`. |
| **gallery.js** | Click-to-enlarge lightbox, built on `<dialog>`. Fail-open: each photo is already an `<a href>` to the file, so without JS the click just opens the image. |
| **reservation-gate.js** | Opens the reservation form **only** inside a configured date window. Fail-**closed**. |
| **config.js** | Prices by day/menu, menu labels, meal times/locations. Shared by `script.js` + `confirmation.js`. |
| **script.js** | Reservation form logic: price calc, duplicate detection (localStorage + JSONP), validation, submit. |
| **confirmation.js** | Post-reservation page: booking summary, contextual messages. |
| **calendar-export.js** | ⚠️ **Currently unused.** Generated `.ics` files for the 2026 programme; its `EVENTS` dates are stale. Kept for the next edition — update `EVENTS` before wiring it back into a page. |

**Google Apps Script** (`Code.gs`) lives in the Apps Script editor attached to the Google Sheet — not in this repo. Manage manually via the Apps Script IDE and redeploy new versions there.

### Two scripts, two opposite failure modes — this is deliberate

- `reservation-gate.js` **fails closed**: the form is `hidden` in the HTML and only JS can open it. If the file 404s or throws, no reservation reaches a Google Sheet nobody is watching.
- `scroll-animations.js` and `events.js` **fail open**: if they don't run, nothing is hidden and the hardcoded badges stay. A broken script must never make content invisible.

Do not "harmonise" these.

---

## ⚙️ Key Architecture

### 0. Events live in HTML, not in a data file

Event content (name, date, place, description) is written directly as
`<article class="event-card">` blocks in `evenements/index.html`. This is
deliberate: a static site with no build step means a JS data file would render
the Évènements page empty for search engines and for anyone without JavaScript.

`events.js` does **one** thing — it reads `data-date="YYYY-MM-DD"` on each card
and rewrites the badge to "À venir" or "Terminé". Nothing else. To add an event,
copy the commented template block already in `evenements/index.html`.

**⚠️ Known duplication**: the three teaser cards on `index.html` are a hand copy
of the ones in `evenements/index.html`. Change a date in one, change it in the
other. There is no include mechanism without a build step; this is the accepted
cost. If the list grows past ~6 events, revisit that trade-off.

### 1. Configuration-Driven Design
All tariffs, menus, and event details are defined **once** in `config.js`:
- `PRICES_BY_DAY` — price per day × menu type
- `MENU_OPTIONS` — available menus (e.g., "Adulte", "Menu enfant")
- `EVENT_INFO_BY_DAY` — time, location, day labels
- `MAX_PEOPLE` — reservation size limit

`script.js` and `confirmation.js` read from `window.LUGLON` (set by config.js) to ensure consistency.

**⚠️ Caveat**: Price tables displayed in HTML (`reservation/index.html`, `programme/index.html`) and JSON-LD structured data remain hardcoded text — update both places when tariffs change.

### 2. Dual-Level Duplicate Detection
The reservation form checks for double-bookings in two stages:

1. **localStorage (instant, same device)**: If a reservation already exists for this evening on this browser, show a warning modal with the existing booking summary.
2. **Server check (JSONP + Apps Script, all devices)**: Query Google Sheets via Apps Script to verify the phone number hasn't booked this evening from *any* device. Timeout: 4 seconds. If Apps Script is cold-starting, the request may fail silently — the user can still proceed (graceful degradation).

### 3. Pre-Submission Confirmation Modal
Before sending to Google Sheets, a summary modal displays:
- Day, time, location
- Name, phone, email
- Per-person menu breakdown
- Total price
- Comments (if any)

User must explicitly confirm. This prevents accidental submissions.

### 4. Google Apps Script Backend
The `doGet` endpoint in Apps Script:
- Validates phone + evening for duplicates
- Records reservation in a day-specific Google Sheet tab
- Sends confirmation email (HTML-formatted) with `.ics` attachment (auto-add to calendar)

**Deployment note**: Edits to `Code.gs` require a manual redeploy in Apps Script IDE (**Deploy → Manage Deployments → Edit → New Version**). A simple save doesn't activate changes.

### 5. Reservation Storage
Each reservation is stored in `localStorage` as:
```json
{
  "soir": "vendredi",
  "jour_label": "Vendredi 31 Juillet",
  "time": "20h00",
  "nom": "...",
  "phone": "...",
  "email": "...",
  "menus": { "standard": 2, "enfant": 1 },
  "comments": "...",
  "total": 35.00,
  "timestamp": 1234567890000
}
```

Displayed on the reservation page as "Your recent bookings on this device."

---

## 🔧 Adding or updating an event

1. Copy the commented `<article class="event-card">` template already sitting in
   `evenements/index.html`, uncomment it, fill it in.
2. Set `data-date="YYYY-MM-DD"` — that attribute, and only that attribute, drives
   the "À venir" / "Terminé" badge. Do not hand-edit badges for date reasons.
   **Multi-day event: use the LAST day**, or the badge flips to "Terminé" while
   the event is still running.
3. Bump `--i` on the new card so its reveal animation stays in sequence.
4. If it's one of the three headline events, mirror the change in the teaser
   cards on `index.html`.

**If the event gets its own page**, three more steps:

5. Create `evenements/<slug>/index.html` — copy `evenements/carnaval/` as the shell.
6. Add it to the `<ul class="site-nav__submenu">` **in every HTML file**. The nav
   block is duplicated across all 12 pages; a submenu entry added to only one of
   them is the most likely way this site drifts.
7. Add the URL to `sitemap.xml`.

### The Évènements dropdown

Open/close is **pure CSS** (`:hover` + `:focus-within` on
`.site-nav__item--has-menu`) — see section 8 of `styles.css`. Deliberate choices:

- **`:focus-within`, not only `:hover`** — a hover-only menu is unreachable by
  keyboard. Focusing the parent link opens the panel, then Tab walks into it.
  No ARIA state to keep in sync, no JS to break.
- **Below 860px there is no dropdown at all** — the sub-links render as an
  indented list, permanently open inside the mobile panel. An accordion nested
  inside an already-sliding panel is two animations deep and a touch trap, for
  four links.
- **The panel is opaque, not glass** — rule A at the top of `styles.css` caps
  `backdrop-filter` at three surfaces, and this would be a fourth.
- `nav.js` only handles Escape (close + return focus to the parent tab). Because
  returning focus to the parent would re-trigger `:focus-within`, it sets
  `.is-collapsed` until focus leaves. If that JS never runs, the menu still works.

---

## 🔧 Reopening the fête for next year

### Reservation window
1. `reservation-gate.js`: set `RESERVATIONS_OPEN` and `RESERVATIONS_CLOSE`
2. Update the `#closed-message` text in `reservation/index.html`
3. Leave the `hidden` attribute on `#reservation-card` alone — that's the fail-closed design

### Prices & Tariffs
1. Update `config.js`: `PRICES_BY_DAY`
2. Manually update the HTML price table in `reservation/index.html`
3. Manually update JSON-LD `Offer` prices wherever an `EventSeries` is republished

### Event Details
1. Update `config.js`: `EVENT_INFO_BY_DAY` (times, locations, day labels)
2. Update `calendar-export.js`: `EVENTS` — and re-include the script + its buttons
   on the fête page if you want "Add to calendar" back
3. Update `Code.gs` (Apps Script): `EVENT_INFO_BY_DAY` (matches config.js for server-side email + .ics)

### Programme & structured data
1. Rewrite the day cards in `evenements/fetes-de-luglon/index.html` (archive the
   old edition or drop it)
2. Re-add an `EventSeries` JSON-LD block there **only once the dates are firm** —
   it was deliberately removed so Google stops advertising the 2026 dates

### Apps Script Deployment URL
1. After deploying a new version in Apps Script IDE, copy the new URL
2. Update `script.js`: `WEB_APP_URL` constant

---

## 🎨 Style & Theming

- **Single stylesheet**: `styles.css` (shared across all pages). Read the two rules at the top before editing.
- **Fonts**: Self-hosted (WOFF2 format) from `fonts/` — no external calls to Google Fonts (GDPR-compliant)
- **Responsive**: Mobile-first design; test on small viewports

### Two greens, and they are not interchangeable

| Token | Use | Value |
|-------|-----|-------|
| `--luglon-green` | **Surfaces**: button fills, borders, rules, the reservation CTA. Designed to carry white text. | `#166136` in both themes |
| `--green-ink` | **Text**: any heading or label written in green. | `#166136` light / `#6bd698` dark |

`--luglon-green` as ink on the dark background scores **2.3:1** — far below the
4.5:1 minimum, and it was already in use that way across the site. `--green-ink`
follows the theme and holds 7.5:1 (light) / 9.7:1 (dark).

**Rule of thumb: headings green, body text `--text`.** Green is on
`.section-head h2`, `.history-section h3`, `.day-card__title`, `.value-card h3`,
`.contact-card h3`, `.gallery-caption h3`, `.kicker`, `.lead`. Prose and card
body copy stay dark — green body text is what makes a page unreadable.

One exception, commented in place: `.btn-add-calendar:hover` keeps
`--luglon-green` because its background is a hardcoded `#ffffff` that does not
follow the dark theme.

### Section heights

`.page-section--tinted` uses a **smaller** vertical padding
(`clamp(2rem, 4vw, 3.25rem)`) than a normal section's `--section-y` (up to 7rem
top *and* bottom). Those tinted bands carry three lines of text; with the full
`--section-y` the grey block was 300px tall for its content. Paired with
`.section-head:last-child { margin-bottom: 0 }`, the band height now follows the
text. Don't "restore consistency" by putting `--section-y` back.

### Gallery

`.gallery-flow` stacks `.gallery-row`s; every second row swaps its grid
**columns** (not DOM order, so the caption is still read after its photo).
`data-reveal="left"` / `"right"` picks the entry direction, reusing the
`fadeInLeft` / `fadeInRight` keyframes — the shared CSS↔JS selector is still
just `[data-reveal]`, so `scroll-animations.js` needed no change. Both are
disabled below 760px, where rows aren't alternated and a horizontal entry would
overflow.

The lightbox is a `<dialog>` (free focus trap, Escape, inertness, `::backdrop`).
It deliberately does **not** reuse `.modal-overlay` / `.modal-box` — those have a
contract with `script.js` (open via `style.display`, which `script.js` reads back).

### Décor végétal (`.has-decor` + `.decor-vine`)

Fougère aigle et rameau de pin maritime au trait, qui poussent dans les marges
au fil du défilement. **Desktop ≥ 1440px uniquement**, aucun JavaScript.
Voir la section 19 de `styles.css` pour le détail — l'essentiel ici :

- Le dessin est `images/decor-fougere.svg`, utilisé comme **masque CSS**, pas
  comme image : la couleur vient de `--green-ink` et suit donc le thème sombre.
  Ce SVG est **généré** par `tools/decor-fougere.py` (voir l'en-tête du script).
  Ce n'est pas une étape de build : le SVG est commité, le site reste statique.
- La pousse est un second masque en dégradé, piloté par `animation-timeline:
  view()`. **Fail-open** : sans cette prise en charge (Firefox) ou en
  `prefers-reduced-motion`, la fougère reste dessinée, simplement immobile.
- L'hôte est n'importe quel conteneur centré portant `.has-decor` :
  `.page-section` sur la plupart des pages, `.wrap.res-wrap` sur les pages
  légales et de réservation. La largeur des lianes ne connaît aucune de ces
  deux largeurs — ne pas y réintroduire `--content-max`.
- ⚠️ **Le bloc de deux `<span>` est dupliqué dans les 12 pages**, comme la nav.
  Même risque de dérive, même remède : le modifier partout ou nulle part.
- L'accueil garde par ailleurs deux `fougeres.png` vert plein autour de
  « FAIRE VIVRE LE VILLAGE ». Deux traitements de fougère cohabitent donc sur
  cette page ; c'est un point ouvert, pas une intention.

---

## 📊 SEO & Metadata

- **Canonical links**: Each page has `<link rel="canonical">` for de-duplication
- **Open Graph**: Controlled image/text for social media shares (WhatsApp, Facebook)
- **JSON-LD structured data**: every page carries `Organization` (name, logo, socials).
  `EventSeries` / per-day `Event` blocks were removed in August 2026 — they described
  the finished 2026 edition, and Google kept surfacing an event that no longer exists.
  Re-add them on `evenements/fetes-de-luglon/` only when real dates are locked in.
- **Sitemap**: `sitemap.xml` lists all indexable pages. `/programme/` is excluded
  on purpose (it's a `noindex` redirect stub).
- **Robots.txt**: Points search engines to sitemap

---

## ⚠️ Known Limitations & Gotchas

1. **Submission confirmation**: Reservations are sent via `fetch` with `mode: 'no-cors'` — the browser can't read the server response, so we show "Confirmed" as soon as the request leaves. To guarantee the Sheet recorded it, the backend would need to return status via JSONP (matching the duplicate-check pattern) and `Code.gs` would need updating. Deferred: requires coordinated redeploy.

2. **Phone masking**: Only sanitizes input on blur; real validation happens server-side in Apps Script.

3. **Duplicate check timeout**: If Apps Script is slow (cold start), the 4-second timeout may expire without a response. The form proceeds anyway, risking duplicate bookings across devices. The second-level check (server JSONP) is a soft safeguard, not a transaction lock.

4. **localStorage scope**: Duplicate detection only works on the same device/browser. Private mode or a different device won't see prior bookings.

5. **Google Sitelinks**: Search results may show sub-pages as links — not controllable, shown at Google's discretion based on traffic/site age.

6. **Event card duplication**: `index.html` teaser cards are a hand copy of the ones in `evenements/index.html`. No build step means no includes. Edit both.

7. **Placeholder content**: The bureau names (`comite/`), gallery slots (`galerie/`), and the 2027 event dates are placeholders marked with a `.todo-note` banner. The banner is deliberately loud — delete it only once the real content is in.

---

## 🔗 Links & References

- **Live site**: [cdf-luglon.fr](https://cdf-luglon.fr)
- **GitHub Pages**: Deployed from `main` branch, no build step
- **Google Apps Script**: Managed separately in Google Sheet editor (not git-tracked)
- **Contact**: contact@cdf-luglon.fr

---

## 💡 Common Tasks

### Add a new menu type
1. Add entry to `MENU_OPTIONS` in `config.js` (e.g., `{ value: 'vegetarian', label: 'Végétarien' }`)
2. Add prices for each day in `PRICES_BY_DAY` in `config.js`
3. Update HTML tables and JSON-LD in relevant pages
4. Update `Code.gs` (Apps Script) if email template needs to reference the new menu

### Change the reservation window
1. Update `RESERVATIONS_OPEN` / `RESERVATIONS_CLOSE` in `reservation-gate.js`
   (`countdown.js` no longer exists — it was removed in the July 2026 fail-closed rework)
2. Update the `#closed-message` text in `reservation/index.html`

### Add a new top-level page
1. Copy an existing page (e.g. `contact/index.html`) as the shell
2. Add the nav `<li>` to **all** pages — the nav block is duplicated in every
   HTML file, and `aria-current="page"` is the only per-page difference
3. Add the URL to `sitemap.xml`
4. Update `<title>`, `<meta description>`, `og:*` and `<link rel="canonical">`
5. Reporter le bloc du **décor végétal** : la classe `has-decor` sur le
   conteneur centré et les deux `<span class="decor-vine">` juste après son
   ouverture (voir n'importe quelle page existante). C'est le troisième bloc
   dupliqué de ce site, avec la nav et le pied de page.

### Fix an email template
1. Edit `Code.gs` in the Apps Script IDE
2. Redeploy: **Deploy → Manage Deployments → Edit → New Version**
3. Test by making a reservation on the staging/test copy of the Google Sheet first

### Debug duplicate detection
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Check Network tab for JSONP request to Apps Script URL
3. Check Application → Local Storage for existing reservations
4. In Safari: enable Develop menu first (Settings → Advanced), then Cmd+Option+I

