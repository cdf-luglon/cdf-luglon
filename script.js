// Table des prix par jour et par type de menu
const PRICES_BY_DAY = {
    'vendredi': {
        'standard': 14.00,
        'poisson': 14.00,
        'enfant': 7.00
    },
    'samedi': {
        'standard': 16.00,
        'poisson': 16.00,
        'enfant': 8.00
    }
};

// Horaires et lieux du repas, par soir (utilisés dans le récapitulatif avant envoi)
const EVENT_INFO_BY_DAY = {
    'vendredi': {
        label: 'Vendredi 31 Juillet',
        time: '20h00',
        location: "Luglon (centre bourg)"
    },
    'samedi': {
        label: 'Samedi 1er Août',
        time: '20h00',
        location: 'Stade de Luglon'
    }
};

// Structure simple des options de menu
const MENU_OPTIONS = [
    { value: 'standard', label: 'Viande' },
    { value: 'poisson', label: 'Poisson' },
    { value: 'enfant', label: 'Menu enfant' }
];

// Constante pour la valeur par défaut pour l'initialisation
const DEFAULT_PEOPLE = 1;

// *************************************************************************
// NOUVELLE URL : Colle ici l'URL obtenue lors du déploiement Google Apps Script
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxHO_Qghkr69Nw_SrBElkaJ_aI_mQCy14B2aivfisn_75ud3M1ACMcM1qBIXg8Ye9YVLw/exec';
// *************************************************************************

// PARTIE RÉSERVATION
const form = document.getElementById('resForm');
const list = document.getElementById('list');
const countEl = document.getElementById('count');
const menuContainer = document.getElementById('menu-container');
const totalCountMessage = document.getElementById('total-count-message');
const soirSelect = document.getElementById('soir');
// Éléments d'erreur
const nameInput = document.getElementById('name');
const nameError = document.getElementById('name-error');
const phoneInput = document.getElementById('phone');
const phoneError = document.getElementById('phone-error');
const phoneMasker = document.getElementById('phone');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const peopleInput = document.getElementById('people');
const peopleError = document.getElementById('people-error');

// Élément pour l'affichage du total en temps réel
const totalAmountEl = document.getElementById('total-amount');
// Nouveaux éléments pour la gestion du statut de soumission
const submitButton = document.getElementById('submit-button');
const submissionStatus = document.getElementById('submission-status');

// Éléments pour la détection de double réservation
const existingReservationNotice = document.getElementById('existing-reservation-notice');
const duplicateModal = document.getElementById('duplicate-modal');
const duplicateDayLabel = document.getElementById('duplicate-day-label');
const duplicateSummary = document.getElementById('duplicate-summary');
const duplicateCancelBtn = document.getElementById('duplicate-cancel');
const duplicateConfirmBtn = document.getElementById('duplicate-confirm');

// Éléments pour la modale de récapitulatif final (étape avant envoi réel)
const recapModal = document.getElementById('recap-modal');
const recapDayTitle = document.getElementById('recap-day-title');
const recapEventTime = document.getElementById('recap-event-time');
const recapEventLocation = document.getElementById('recap-event-location');
const recapName = document.getElementById('recap-name');
const recapPhone = document.getElementById('recap-phone');
const recapEmail = document.getElementById('recap-email');
const recapPeople = document.getElementById('recap-people');
const recapMenus = document.getElementById('recap-menus');
const recapNotesRow = document.getElementById('recap-notes-row');
const recapNotes = document.getElementById('recap-notes');
const recapTotal = document.getElementById('recap-total');
const recapCancelBtn = document.getElementById('recap-cancel');
const recapConfirmBtn = document.getElementById('recap-confirm');

const DAY_LABELS = { vendredi: 'Vendredi', samedi: 'Samedi' };


// FONCTION UTILITAIRE : Calcule le prix d'un seul menu en fonction du jour
function getMenuPrice(day, menuType) {
    return PRICES_BY_DAY[day] ? (PRICES_BY_DAY[day][menuType] || 0) : 0;
}

// 1. GESTION DES RÉSERVATIONS (Stockage Local)
function loadReservations(){
  try{return JSON.parse(localStorage.getItem('luglon_reservations')||'[]');}catch{return[];}
}
function saveReservations(arr){localStorage.setItem('luglon_reservations',JSON.stringify(arr));}

// Renvoie la réservation existante pour un soir donné (ou null si aucune)
function findReservationForDay(day){
  const data = loadReservations();
  return data.find(r => r.soir === day) || null;
}

// Formate la date/heure RÉELLE d'une réservation (figée, basée sur son
// timestamp d'origine) — affiche "aujourd'hui à HH:MM" si c'est le jour
// même, sinon "JJ/MM à HH:MM". Gère aussi le cas d'anciennes réservations
// enregistrées avant l'ajout du timestamp (fallback "heure inconnue").
function formatReservationDate(timestamp) {
    if (!timestamp) return 'heure inconnue';

    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

    if (isToday) {
        return `${time} (aujourd'hui)`;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${time} (${day}/${month})`;
}

// 2. RENDU DE LA LISTE DES RÉSERVATIONS (Version complète restaurée)
function render(){
  const data=loadReservations();
  countEl.textContent=data.length;
  list.innerHTML='';
  if(!data.length){list.innerHTML='<div class="empty">Aucune réservation pour l\'instant.</div>';return;}
  
  data.slice().reverse().forEach(r=>{
    const el=document.createElement('div');
    el.className='res-item';
    
    // Calculer la répartition des menus et le prix total en fonction du jour
    const menuCounts = {};
    let totalPrice = 0;
    const day = r.soir;

    r.menus.forEach(menuValue => {
        menuCounts[menuValue] = (menuCounts[menuValue] || 0) + 1;
        totalPrice += getMenuPrice(day, menuValue);
    });
    
    // Transformer l'objet des comptes en une chaîne lisible avec les prix par personne
    const menuSummary = Object.keys(menuCounts).map(key => {
        const menuOption = MENU_OPTIONS.find(opt => opt.value === key);
        const price = getMenuPrice(day, key);
        const formattedPrice = price.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        const label = menuOption ? `${menuOption.label} (${formattedPrice}€)` : key;
        return `${menuCounts[key]} x ${label}`;
    }).join(' / ');

    const formattedDate = formatReservationDate(r.timestamp);
    const formattedTotal = totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    
    el.innerHTML=`
      <h4>${r.name} (${r.phone}) — ${r.people} pers 
      <span class="total-price">Total: ${formattedTotal}€</span></h4>
      <div class="meta">${r.soir} • Menus: ${menuSummary} • Réservé à ${formattedDate}</div>
      <div>Commentaire : ${r.notes || 'Aucun'}</div>
    `;
    
    list.appendChild(el);
  });
}

// FONCTION UTILITAIRE CONSERVÉE POUR LA CLARTÉ
function updatePriceRecap() {
    calculateTotalPrice();
}

// Construit un résumé HTML lisible d'une réservation existante (utilisé par
// le message d'info et par la modale de double réservation)
function buildReservationSummaryHTML(r) {
    const menuCounts = {};
    let totalPrice = 0;
    r.menus.forEach(menuValue => {
        menuCounts[menuValue] = (menuCounts[menuValue] || 0) + 1;
        totalPrice += getMenuPrice(r.soir, menuValue);
    });
    const menuSummary = Object.keys(menuCounts).map(key => {
        const menuOption = MENU_OPTIONS.find(opt => opt.value === key);
        const label = menuOption ? menuOption.label : key;
        return `${menuCounts[key]} x ${label}`;
    }).join(' / ');
    const formattedTotal = totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 });

    return `
        <strong>${r.name}</strong> (${r.phone}) — ${r.people} pers.<br>
        Menus : ${menuSummary}<br>
        Total : ${formattedTotal}€
    `;
}

// Affiche (ou masque) le message informatif "vous avez déjà réservé pour [autre jour]"
// Se déclenche au changement du select "soir"
function checkExistingReservationForDay() {
    const selectedDay = soirSelect.value;
    const existing = findReservationForDay(selectedDay);

    if (existing) {
        // Une réservation existe déjà PILE pour le jour actuellement sélectionné :
        // on prévient, mais le vrai blocage se fera à la soumission (modale).
        existingReservationNotice.style.display = 'block';
        existingReservationNotice.textContent =
            `Attention : vous avez déjà une réservation pour ${DAY_LABELS[selectedDay]}.`;
        return;
    }

    // Sinon, on regarde si une réservation existe pour l'AUTRE jour, pour informer
    // (sans bloquer) que la personne peut aussi réserver celui-ci en plus.
    const otherDay = selectedDay === 'vendredi' ? 'samedi' : 'vendredi';
    const otherExisting = findReservationForDay(otherDay);

    if (otherExisting) {
        existingReservationNotice.style.display = 'block';
        existingReservationNotice.textContent =
            `Note : vous êtes en train de réserver pour ${DAY_LABELS[selectedDay] === 'Vendredi' ? 'le vendredi' : 'le samedi'} et avez déjà réservé pour ${DAY_LABELS[otherDay]}.`;
    } else {
        existingReservationNotice.style.display = 'none';
        existingReservationNotice.textContent = '';
    }
}

// FONCTION : Calcule et affiche le prix total en temps réel
function calculateTotalPrice() {
    const selectedDay = soirSelect.value;
    const numPeople = Number(peopleInput.value);
    let currentTotal = 0;

    if (numPeople >= 1 && PRICES_BY_DAY[selectedDay]) {
        // Parcourt tous les sélecteurs de menu générés dynamiquement
        for (let i = 0; i < numPeople; i++) {
            const menuSelect = document.getElementById(`menu-${i}`);
            if (menuSelect && menuSelect.value) {
                const menuType = menuSelect.value;
                currentTotal += getMenuPrice(selectedDay, menuType);
            } else if (menuSelect) {
                currentTotal += getMenuPrice(selectedDay, MENU_OPTIONS[0].value);
            }
        }
    }

    const formattedTotal = currentTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    totalAmountEl.textContent = `${formattedTotal}€`;
}


// 3. GÉNÉRATION DYNAMIQUE DES CHAMPS DE MENUS
function generateMenuInputs() {
    const numPeople = Number(peopleInput.value);
    menuContainer.innerHTML = '';
    
    totalCountMessage.textContent = `Veuillez choisir le menu pour chacune des ${numPeople} personne${numPeople > 1 ? 's' : ''}.`;

    if (numPeople < 1) return;

    for (let i = 0; i < numPeople; i++) {
        const group = document.createElement('div');
        group.className = 'menu-selection-group';
        group.innerHTML = `
            <h5>Personne ${i + 1}</h5> 
            <div class="menu-options">
                <div>
                    <select id="menu-${i}" name="menu-${i}" required>
                        ${MENU_OPTIONS.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
        menuContainer.appendChild(group);
        
        // Écouteur pour mettre à jour le total quand un menu est changé
        document.getElementById(`menu-${i}`).addEventListener('change', calculateTotalPrice);
    }
    calculateTotalPrice();
}

// 4. FORMATAGE DU TÉLÉPHONE (AJOUT DE L'ESPACE AUTO)
phoneMasker.addEventListener('input', (e) => {
    const input = e.target;
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length > 0) {
        value = value.match(/.{1,2}/g).join(' ');
    }
    
    if (value.length > 14) {
          value = value.substring(0, 14);
    }
    
    input.value = value;
});

// 5. FONCTION DE VALIDATION DES CHAMPS DE CONTACT
function validateContactFields() {
    let isValid = true;
    const nameValue = nameInput.value.trim();
    const phoneValue = phoneInput.value.replace(/\s/g, '').trim();
    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const numPersonsValue = parseInt(peopleInput.value, 10) || 0;
    const errorMessage = 'Remplir ce champ';

    // Validation du Nom
    if (nameValue === '') {
        nameError.textContent = errorMessage;
        nameInput.classList.add('input-error');
        isValid = false;
    } else {
        nameError.textContent = '';
        nameInput.classList.remove('input-error');
    }

    // Validation du Téléphone
    if (phoneValue.length == 0) {
        phoneError.textContent = errorMessage;
        phoneInput.classList.add('input-error');
        isValid = false;
    } else if (phoneValue.length !== 10) {
        phoneError.textContent = 'Numéro invalide (10 chiffres)';
        phoneInput.classList.add('input-error');
        isValid = false;
    } else {
        phoneError.textContent = '';
        phoneInput.classList.remove('input-error');
    }
    
    // Validation de l'Email
    if (emailValue === '') {
        emailError.textContent = errorMessage;
        emailInput.classList.add('input-error');
        isValid = false;
    } else if (!emailRegex.test(emailValue)) {
        emailError.textContent = 'Le format d\'e-mail est invalide';
        emailInput.classList.add('input-error');
        isValid = false;
    } else {
        emailError.textContent = '';
        emailInput.classList.remove('input-error');
    }
    
    // 4. Validation du Nombre de Personnes (Minimum 1)
    if (numPersonsValue < 1) {
        peopleError.textContent = 'Minimum 1 personne requise.';
        peopleInput.classList.add('input-error');
        isValid = false;
    } else {
        peopleError.textContent = '';
        peopleInput.classList.remove('input-error');
    }
    

    return isValid;
}

// Fonction pour afficher le statut de soumission
let statusTimeout; 
function setSubmissionStatus(status, message = '') {
    submissionStatus.className = ''; 
    submissionStatus.style.display = 'none'; 
    clearTimeout(statusTimeout); 

    if (status) {
        submissionStatus.classList.add(status);
        submissionStatus.textContent = message;
        submissionStatus.style.display = 'flex';
    }

    if (status === 'success' || status === 'error') {
        statusTimeout = setTimeout(() => {
            submissionStatus.style.display = 'none';
        }, 5000); 
    }
}


// 6. GESTION DE LA SOUMISSION DU FORMULAIRE

// Stocke temporairement les données validées en attendant la confirmation
// finale de l'utilisateur (via la modale de récapitulatif, et éventuellement
// la modale de double réservation avant elle).
let pendingSubmission = null;

form.addEventListener('submit', e => {
    e.preventDefault();

    // Validation des champs de contact
    if (!validateContactFields()) {
        return;
    }
    const numPeople = Number(peopleInput.value);
    const selectedDay = form.soir.value;

    // On prépare nos compteurs pour la base de données
    let nbViande = 0;
    let nbPoisson = 0;
    let nbEnfant = 0;

    // Récupérer tous les choix de menus dynamiques (et vérifier qu'ils sont choisis)
    const selectedMenus = [];
    for (let i = 0; i < numPeople; i++) {
        const menuSelect = document.getElementById(`menu-${i}`);
        if (!menuSelect || !menuSelect.value) {
            setSubmissionStatus('error', `Le type de repas n'a pas été sélectionné pour la personne ${i + 1}.`);
            return;
        }

        // On incrémente le compteur correspondant
        if (menuSelect.value === 'standard') nbViande++;
        if (menuSelect.value === 'poisson') nbPoisson++;
        if (menuSelect.value === 'enfant') nbEnfant++;

        selectedMenus.push(menuSelect.value);
    }

    // Préparer les données pour l'envoi au script Google (Format clé:valeur)
    const formData = {
        'Nom': nameInput.value.trim(),
        'Email': emailInput.value.trim(),
        'Telephone': phoneInput.value.replace(/\s/g, '').trim(),
        'NbPersonnes': numPeople,
        'Soir': selectedDay,
        'Viande': nbViande,
        'Poisson': nbPoisson,
        'Enfant': nbEnfant,
        'Notes': form.notes.value.trim(),
        'Total_Euros': parseFloat(totalAmountEl.textContent.replace('€', '').replace(',', '.').replace(/\s/g, '')),
        'Timestamp': new Date().toLocaleString('fr-FR'),
    };

    pendingSubmission = { formData, selectedMenus };

    // VÉRIFICATION ANTI DOUBLE-RÉSERVATION : si une réservation existe déjà
    // pour ce jour précis sur cet appareil, on bloque et on demande confirmation
    // AVANT même d'afficher le récapitulatif.
    const existing = findReservationForDay(selectedDay);
    if (existing) {
        duplicateDayLabel.textContent = DAY_LABELS[selectedDay] || selectedDay;
        duplicateSummary.innerHTML = buildReservationSummaryHTML(existing);
        duplicateModal.style.display = 'flex';
        return; // on attend la décision de l'utilisateur via la modale
    }

    openRecapModal();
});

// Bouton "Annuler" de la modale de double réservation
duplicateCancelBtn.addEventListener('click', () => {
    duplicateModal.style.display = 'none';
    pendingSubmission = null;
});

// Bouton "Oui, réserver quand même" de la modale doublon : on passe ensuite
// par l'étape récapitulatif, comme pour un envoi normal.
duplicateConfirmBtn.addEventListener('click', () => {
    duplicateModal.style.display = 'none';
    if (pendingSubmission) {
        openRecapModal();
    }
});

// --- ÉTAPE 1 : Affichage du récapitulatif détaillé avant tout envoi réel ---
function openRecapModal() {
    if (!pendingSubmission) return;
    const { formData, selectedMenus } = pendingSubmission;
    const day = formData.Soir;
    const info = EVENT_INFO_BY_DAY[day];

    recapDayTitle.textContent = info ? info.label : DAY_LABELS[day];
    recapEventTime.textContent = info ? info.time : '';
    recapEventLocation.textContent = info ? info.location : '';

    recapName.textContent = formData.Nom;
    recapPhone.textContent = formData.Telephone;
    recapEmail.textContent = formData.Email;
    recapPeople.textContent = formData.NbPersonnes;

    // Détail des menus, ex : "4 × Viande / 3 × Poisson / 1 × Menu enfant"
    const menuCounts = {};
    selectedMenus.forEach(m => { menuCounts[m] = (menuCounts[m] || 0) + 1; });
    recapMenus.innerHTML = Object.keys(menuCounts).map(key => {
        const opt = MENU_OPTIONS.find(o => o.value === key);
        const label = opt ? opt.label : key;
        return `<li>${menuCounts[key]} × ${label}</li>`;
    }).join('');

    if (formData.Notes) {
        recapNotesRow.style.display = 'flex';
        recapNotes.textContent = formData.Notes;
    } else {
        recapNotesRow.style.display = 'none';
    }

    const formattedTotal = formData.Total_Euros.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    recapTotal.textContent = `${formattedTotal}€`;

    recapModal.style.display = 'flex';
}

// Bouton "Modifier" de la modale récap : on referme, l'utilisateur peut
// corriger le formulaire avant de re-soumettre.
recapCancelBtn.addEventListener('click', () => {
    recapModal.style.display = 'none';
    pendingSubmission = null;
});

// Bouton "Confirmer la réservation" : c'est SEULEMENT ici que l'envoi réel
// est déclenché, après validation explicite du récapitulatif complet.
recapConfirmBtn.addEventListener('click', () => {
    recapModal.style.display = 'none';
    if (pendingSubmission) {
        submitReservation(pendingSubmission.formData, pendingSubmission.selectedMenus);
        pendingSubmission = null;
    }
});

// Envoi effectif de la réservation (factorisé pour être appelé directement,
// ou après confirmation explicite d'une double réservation)
function submitReservation(formData, selectedMenus) {
    // Désactiver le bouton et afficher le statut "Envoi en cours..."
    submitButton.disabled = true;
    setSubmissionStatus('sending', 'Réservation en cours...');

    // Envoi des données au Google Apps Script
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // <-- LE CHANGEMENT MAGIQUE EST ICI
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData).toString(),
    })
    .then(() => {
        // En mode no-cors, on ne peut pas lire le {success: true} de Google.
        // Mais si le code arrive ici, c'est que la requête est bien partie vers le Sheet !

        // 1. Logique de confirmation pour le stockage local
        const data = loadReservations();
        const entry = {
            name: formData.Nom,
            phone: formData.Telephone,
            people: formData.NbPersonnes,
            soir: formData.Soir,
            menus: selectedMenus,
            notes: formData.Notes,
            timestamp: Date.now() // horodatage réel, utilisé par la page de confirmation
        };

        data.push(entry);
        saveReservations(data);
        // On garde une trace de "la dernière réservation effectuée" pour que
        // la page de confirmation sache laquelle afficher.
        localStorage.setItem('luglon_last_reservation_timestamp', String(entry.timestamp));
        render();

        // 2. Redirection vers la page de confirmation dédiée
        window.location.href = '/reservation/confirmation/';
    })
    .catch(error => {
        // Cette erreur ne s'affichera que si l'utilisateur n'a vraiment pas d'internet
        console.error('Erreur lors de l\'envoi :', error);
        setSubmissionStatus('error', "Erreur de connexion internet. Veuillez réessayer.");
        submitButton.disabled = false;
    });
}

// Initialisation
if (peopleInput) {
    peopleInput.value = DEFAULT_PEOPLE;
    generateMenuInputs();
    calculateTotalPrice();
}
checkExistingReservationForDay();
render();
