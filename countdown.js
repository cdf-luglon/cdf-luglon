// ============================================================
// countdown.js — Compte à rebours avant clôture des réservations
// À inclure sur chaque page : <script src="/countdown.js"></script>
// ============================================================

(function () {

  // *************************************************************************
  // DATE DE CLÔTURE DES RÉSERVATIONS
  // Format : 'YYYY-MM-DDTHH:MM:SS' (heure locale, fuseau de Luglon = Europe/Paris)
  const RESERVATION_DEADLINE = new Date('2026-07-28T23:59:59');
  // *************************************************************************

  const banner = document.getElementById('countdown-banner');
  if (!banner) return; // Pas de bannière sur cette page, on ne fait rien

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  // Éléments spécifiques à la page réservation (peuvent être absents ailleurs)
  const closedMessage = document.getElementById('closed-message');
  const reservationCard = document.getElementById('reservation-card');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function isClosed() {
    return new Date() >= RESERVATION_DEADLINE;
  }

  function applyClosedState() {
    banner.classList.add('countdown-closed');
    banner.querySelector('.countdown-label').textContent = 'Réservations closes';
    if (daysEl) daysEl.textContent = '00';
    if (hoursEl) hoursEl.textContent = '00';
    if (minutesEl) minutesEl.textContent = '00';
    if (secondsEl) secondsEl.textContent = '00';

    // Si on est sur la page réservation : on masque le formulaire et on
    // affiche le message d'indisponibilité à la place.
    if (closedMessage && reservationCard) {
      reservationCard.style.display = 'none';
      closedMessage.style.display = 'block';
    }
  }

  function tick() {
    if (isClosed()) {
      applyClosedState();
      return; // on arrête de planifier d'autres ticks
    }

    const now = new Date();
    const diffMs = RESERVATION_DEADLINE - now;

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minutesEl) minutesEl.textContent = pad(minutes);
    if (secondsEl) secondsEl.textContent = pad(seconds);

    // Dernières 48h : on passe en mode "urgence" visuelle (pulse plus marqué)
    if (diffMs <= 48 * 3600 * 1000) {
      banner.classList.add('countdown-urgent');
    }

    requestAnimationFrame(() => {
      setTimeout(tick, 1000);
    });
  }

  // Si la page se charge déjà après la date de clôture (ex: visite tardive)
  if (isClosed()) {
    applyClosedState();
  } else {
    tick();
  }

})();
