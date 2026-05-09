// ============================================================
// scroll-animations.js — Animations au scroll (IntersectionObserver)
// À inclure dans chaque page : <script src="/scroll-animations.js"></script>
// ============================================================

(function () {

  // Fonction utilitaire : crée un observer et l'applique à une liste d'éléments
  function observe(selector, options) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          observer.unobserve(entry.target); // Une seule fois
        }
      });
    }, options);

    document.querySelectorAll(selector).forEach((el) => observer.observe(el));
  }

  // rootMargin positif = se déclenche AVANT que l'élément soit complètement visible

  // 1. Blocs du programme gauche/droite (la classe scroll-visible va sur .planning-section)
  observe('.planning-section', { threshold: 0.08, rootMargin: '0px 0px -100px 0px' });

  // 2. Section histoire (accueil)
  observe('.history-section', { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

  // 3. Cartes de navigation
  observe('.nav-grid a.nav-card', { threshold: 0.05, rootMargin: '0px 0px -100px 0px' });

  // 4. Carte formulaire réservation
  observe('.res-wrap .card', { threshold: 0.02, rootMargin: '0px 0px -100px 0px' });

  // 5. Tableau de prix et note d'avertissement
  observe('.price-plaque', { threshold: 0.05, rootMargin: '0px 0px -100px 0px' });
  observe('.warning-note', { threshold: 0.05, rootMargin: '0px 0px -100px 0px' });

})();
