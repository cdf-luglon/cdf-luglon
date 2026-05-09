// ============================================================
// scroll-animations.js — Animations au scroll (IntersectionObserver)
// À inclure dans chaque page : <script src="/scroll-animations.js"></script>
// ============================================================

(function () {

  // --- 1. Blocs du programme : planning-section (gauche / droite) ---
  // rootMargin positif = déclenche AVANT que l'élément entre dans le viewport
  const planningObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          planningObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px 60px 0px' }
  );

  document.querySelectorAll('.planning-section').forEach((el) => {
    planningObserver.observe(el);
  });

  // --- 2. Section histoire (accueil) ---
  const historyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          historyObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px 80px 0px' }
  );

  document.querySelectorAll('.history-section').forEach((el) => {
    historyObserver.observe(el);
  });

  // --- 3. Cartes de navigation : apparition en cascade ---
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          navObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px 80px 0px' }
  );

  document.querySelectorAll('.nav-grid a.nav-card').forEach((el) => {
    navObserver.observe(el);
  });

  // --- 4. Carte formulaire réservation ---
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          cardObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.02, rootMargin: '0px 0px 100px 0px' }
  );

  document.querySelectorAll('.res-wrap .card').forEach((el) => {
    cardObserver.observe(el);
  });

  // --- 5. Tableau de prix et note d'avertissement (page réservation) ---
  const reservationBlocksObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          reservationBlocksObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px 80px 0px' }
  );

  document.querySelectorAll('.price-plaque, .warning-note').forEach((el) => {
    reservationBlocksObserver.observe(el);
  });

})();    { threshold: 0.2 }
  );

  document.querySelectorAll('.history-section').forEach((el) => {
    historyObserver.observe(el);
  });

  // --- 3. Cartes de navigation : apparition en cascade ---
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          navObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('.nav-grid a.nav-card').forEach((el) => {
    navObserver.observe(el);
  });

  // --- 4. Carte formulaire réservation ---
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          cardObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 }
  );

  document.querySelectorAll('.res-wrap .card').forEach((el) => {
    cardObserver.observe(el);
  });

  // --- 5. Éléments génériques avec data-scroll ---
  // Usage : <div data-scroll="fadeUp"> ou data-scroll="fadeLeft"
  const genericObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          genericObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('[data-scroll]').forEach((el) => {
    genericObserver.observe(el);
  });

})();
