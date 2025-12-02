// Configuration des prix par jour et par type de menu
const PRICES_BY_DAY = {
    'vendredi': {
        'standard': 14.00,
        'poisson': 14.00,
        'enfant': 7.00
    },
    'samedi': {
        'standard': 17.00,
        'poisson': 17.00,
        'enfant': 8.50
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
// VOICI L'URL DE DÉPLOIEMENT DU GOOGLE APPS SCRIPT
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwJEpHVydABQd3GZWyjCgyoCbRvHz85FXt7o2Z9g5Baeo7Akdu1ZntSEaWEbVgmhM89Rg/exec';
// *************************************************************************

// PARTIE RÉSERVATION
const form = document.getElementById('resForm');
const list = document.getElementById('list');
const countEl = document.getElementById('count');
const peopleInput = document.getElementById('people');
const menuContainer = document.getElementById('menu-container');
const totalCountMessage = document.getElementById('total-count-message');
const soirSelect = document.getElementById('soir');
// Éléments d'erreur
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const nameError = document.getElementById('name-error');
const phoneError = document.getElementById('phone-error');
const phoneMasker = document.getElementById('phone');
const emailInput = document.getElementById('email');
// Élément pour l'affichage du total en temps réel
const totalAmountEl = document.getElementById('total-amount');
// Nouveaux éléments pour la gestion du statut de soumission
const submitButton = document.getElementById('submit-button');
const submissionStatus = document.getElementById('submission-status');


// FONCTION UTILITAIRE : Calcule le prix d'un seul menu en fonction du jour
function getMenuPrice(day, menuType) {
    return PRICES_BY_DAY[day] ? (PRICES_BY_DAY[day][menuType] || 0) : 0;
}

// 1. GESTION DES RÉSERVATIONS (Stockage Local)
function loadReservations(){
  try{return JSON.parse(localStorage.getItem('luglon_reservations')||'[]');}catch{return[];}
}
function saveReservations(arr){localStorage.setItem('luglon_reservations',JSON.stringify(arr));}

// 2. RENDU DE LA LISTE DES RÉSERVATIONS
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

    const now = new Date();
    const formattedDate = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (aujourd'hui)`;
    const formattedTotal = totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    
    el.innerHTML=`
      <h4>${r.name} (${r.phone}) — ${r.people} pers 
      <span class="total-price">Total: ${formattedTotal}€</span></h4>
      <div class="meta">${r.soir} • Menus: ${menuSummary} • Réservé à ${formattedDate}</div>
      <div>Notes: ${r.notes || '—'}</div>
    `;
    list.appendChild(el);
  });
}

// FONCTION INUTILE MAIS CONSERVÉE POUR LA CLARTÉ DU JS
function updatePriceRecap() {
    calculateTotalPrice();
}

// NOUVELLE FONCTION : Calcule et affiche le prix total en temps réel
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
    if (phoneValue.length !== 10) {
        phoneError.textContent = 'Numéro invalide (10 chiffres)';
        phoneInput.classList.add('input-error');
        isValid = false;
    } else {
        phoneError.textContent = '';
        phoneInput.classList.remove('input-error');
    }
    
    // Validation de l'Email est gérée par l'attribut required du HTML

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
form.addEventListener('submit',e=>{
    e.preventDefault();
    
    // Validation des champs de contact
    if (!validateContactFields()) {
        return;
    }

    const numPeople = Number(peopleInput.value);
    if (numPeople < 1) {
        setSubmissionStatus('error', "Veuillez indiquer le nombre de personnes.");
        return;
    }

    // Récupérer tous les choix de menus dynamiques (et vérifier qu'ils sont choisis)
    const selectedMenus = [];
    for (let i = 0; i < numPeople; i++) {
        const menuSelect = document.getElementById(`menu-${i}`);
        if (!menuSelect || !menuSelect.value) {
            setSubmissionStatus('error', `Le type de repas n'a pas été sélectionné pour la personne ${i + 1}.`);
            return;
        }
        selectedMenus.push(menuSelect.value);
    }
    
    // Désactiver le bouton et afficher le statut "Envoi en cours..."
    submitButton.disabled = true;
    setSubmissionStatus('sending', 'Envoi de votre réservation...');

    // Préparer les données pour l'envoi au Google Sheet
    const formData = {
        'Nom': nameInput.value.trim(),
        'Email': emailInput.value.trim(), 
        'Telephone': phoneInput.value.replace(/\s/g, '').trim(),
        'NbPersonnes': numPeople,
        'Soir': form.soir.value,
        'Menus_Details': selectedMenus.join(', '), 
        'Notes': form.notes.value.trim(),
        'Total_Euros': totalAmountEl.textContent,
        'Timestamp': new Date().toLocaleString('fr-FR'), 
    };
    
    // Envoi des données au Google Apps Script
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData).toString(),
    })
    .then(() => {
        // Logique de confirmation pour le stockage local
        const data=loadReservations();
        const entry={
            name: formData.Nom,
            phone: formData.Telephone,
            people: formData.NbPersonnes,
            soir: formData.Soir,
            menus: selectedMenus,
            notes: formData.Notes
        };
        
        data.push(entry);
        saveReservations(data);
        render();

        // Afficher une confirmation de succès
        setSubmissionStatus('success', `Réservation pour ${formData.Nom} ENVOYÉE ! (Total: ${formData.Total_Euros})`);
        
        // Réinitialisation après soumission
        form.reset();
        peopleInput.value = DEFAULT_PEOPLE;
        generateMenuInputs();
        calculateTotalPrice();
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi au Google Sheet:', error);
        setSubmissionStatus('error', "Erreur lors de l'envoi. Veuillez réessayer.");
    })
    .finally(() => {
        submitButton.disabled = false;
    });
});

// Initialisation
if (peopleInput) {
    peopleInput.value = DEFAULT_PEOPLE;
    generateMenuInputs();
    calculateTotalPrice();
}
