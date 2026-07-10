/* ============================================================
   MIRACLE NJUB PORTFOLIO - SCRIPTS.JS
   Clean, scalable, performance-optimized
   ============================================================ */

(function() {
  'use strict';

  /* ============================================================
     CONFIG
     ============================================================ */
  const CONFIG = {
    navbarScrollThreshold: 50,
    observerThreshold: 0.1,
    observerRootMargin: '0px 0px -60px 0px',
    counterThreshold: 0.5,
    counterDuration: 2000,
    parallaxSmoothing: 0.08,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isTouch: window.matchMedia('(pointer: coarse)').matches,
  };

  /* ============================================================
     UTILITIES
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, evt, fn, opts = {}) => el.addEventListener(evt, fn, opts);
  const off = (el, evt, fn, opts = {}) => el.removeEventListener(evt, fn, opts);
  const raf = (fn) => requestAnimationFrame(fn);

  /* ============================================================
     NAVBAR SCROLL EFFECT
     ============================================================ */
  const navbar = $('#navbar');
  if (navbar) {
    let ticking = false;
    function updateNavbar() {
      navbar.classList.toggle('scrolled', window.scrollY > CONFIG.navbarScrollThreshold);
      ticking = false;
    }
    on(window, 'scroll', () => {
      if (!ticking) { raf(updateNavbar); ticking = true; }
    }, { passive: true });
  }

  /* ============================================================
     INTERSECTION OBSERVER - SCROLL REVEAL ANIMATIONS
     ============================================================ */
  const animatedEls = $$('[data-animate="fade-up"]');
  if (animatedEls.length && !CONFIG.reducedMotion) {
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay) || 0;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          scrollObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: CONFIG.observerThreshold,
      rootMargin: CONFIG.observerRootMargin
    });
    animatedEls.forEach(el => scrollObserver.observe(el));
  } else if (CONFIG.reducedMotion) {
    animatedEls.forEach(el => el.classList.add('visible'));
  }

  /* ============================================================
     COUNTER ANIMATION - HERO STATS
     ============================================================ */
  const statNumbers = $$('.stat-number[data-count]');
  if (statNumbers.length && !CONFIG.reducedMotion) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / CONFIG.counterDuration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target) + suffix;
          if (progress < 1) raf(tick);
          else el.textContent = target + suffix;
        }
        raf(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: CONFIG.counterThreshold });
    statNumbers.forEach(el => counterObserver.observe(el));
  }

  /* ============================================================
     3D CARD TILT EFFECT (Desktop only)
     ============================================================ */
  if (!CONFIG.isTouch && !CONFIG.reducedMotion) {
    const tiltCards = $$('.service-card-3d, .work-card-3d, .testimonial-card-3d');
    tiltCards.forEach(card => {
      const inner = card.querySelector('.service-card-inner, .work-card-inner, .testimonial-inner');
      if (!inner) return;

      let rafId = null;
      let targetRotateX = 0, targetRotateY = 0;
      let currentRotateX = 0, currentRotateY = 0;

      function animateTilt() {
        currentRotateX += (targetRotateX - currentRotateX) * 0.12;
        currentRotateY += (targetRotateY - currentRotateY) * 0.12;
        inner.style.transform = `translateY(var(--card-lift, 0px)) perspective(1000px) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
        if (Math.abs(targetRotateX - currentRotateX) > 0.01 || Math.abs(targetRotateY - currentRotateY) > 0.01) {
          rafId = raf(animateTilt);
        } else {
          rafId = null;
        }
      }

      on(card, 'mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotateY = x * 10;
        targetRotateX = -y * 10;
        if (!rafId) rafId = raf(animateTilt);
      });

      on(card, 'mouseleave', () => {
        targetRotateX = 0;
        targetRotateY = 0;
        if (!rafId) rafId = raf(animateTilt);
      });
    });
  }

  /* ============================================================
     MOBILE MENU - SLIDE FROM RIGHT
     ============================================================ */
  const mobileMenuBtn = $('.mobile-menu-btn');
  const navLinks = $('#navLinks');
  let menuOverlay = null;

  function createMenuOverlay() {
    if (menuOverlay) return;
    menuOverlay = document.createElement('div');
    menuOverlay.className = 'mobile-menu-overlay';
    menuOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(menuOverlay);
    on(menuOverlay, 'click', closeMobileMenu);
  }

  function openMobileMenu() {
    if (!navLinks || !mobileMenuBtn) return;
    createMenuOverlay();
    navLinks.classList.add('active');
    document.body.classList.add('menu-open');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    mobileMenuBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
    mobileMenuBtn.setAttribute('aria-label', 'Close menu');
    // Focus trap: focus first link
    const firstLink = navLinks.querySelector('a');
    if (firstLink) firstLink.focus();
    on(document, 'keydown', handleMenuKeydown);
  }

  function closeMobileMenu() {
    if (!navLinks || !mobileMenuBtn) return;
    navLinks.classList.remove('active');
    document.body.classList.remove('menu-open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
    mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');
    off(document, 'keydown', handleMenuKeydown);
    mobileMenuBtn.focus();
  }

  function handleMenuKeydown(e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
    }
    if (e.key === 'Tab' && navLinks) {
      const focusable = navLinks.querySelectorAll('a[href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  window.toggleMobileMenu = function() {
    if (navLinks && navLinks.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  // Auto-close menu on link click
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      on(link, 'click', () => {
        if (navLinks.classList.contains('active')) closeMobileMenu();
      });
    });
  }

  /* ============================================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */
  $$('a[href^="#"]').forEach(anchor => {
    on(anchor, 'click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = $(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        window.scrollTo({ top, behavior: CONFIG.reducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* ============================================================
     KEYBOARD ACCESSIBILITY FOR INTERACTIVE CARDS
     ============================================================ */
  $$('.service-card-3d, .work-card-3d, .work-mini-card').forEach(card => {
    on(card, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const link = card.querySelector('a');
        if (link) link.click();
      }
    });
  });

  /* ============================================================
     GLASSMORPHISM "VIEW WORK" REVEAL
     Tap/click a project image to reveal the glass button.
     Click the button itself to follow the link. Desktop hover
     still works via CSS; this layer makes it tap-friendly too.
     ============================================================ */
  const revealTargets = $$('.work-image, .project-image-wrap');
  if (revealTargets.length) {
    function closeAllReveals(except) {
      revealTargets.forEach(t => {
        if (t !== except) t.classList.remove('is-revealed');
      });
    }

    revealTargets.forEach(target => {
      on(target, 'click', (e) => {
        const btn = e.target.closest('.glass-view-btn');
        if (btn) return; // let the button's own link navigate normally
        e.preventDefault();
        const willOpen = !target.classList.contains('is-revealed');
        closeAllReveals(target);
        target.classList.toggle('is-revealed', willOpen);
      });

      on(target, 'keydown', (e) => {
        if (e.key === 'Escape') target.classList.remove('is-revealed');
      });
    });

    on(document, 'click', (e) => {
      if (!e.target.closest('.work-image, .project-image-wrap')) {
        closeAllReveals();
      }
    }, { passive: true });
  }

  /* ============================================================
     CONTACT FORM HANDLING (FORMSPREE)
     ============================================================ */
  const contactForm = $('#contactForm');
  if (contactForm) {
    on(contactForm, 'submit', async function(e) {
      e.preventDefault();

      const submitBtn = $('#formSubmitBtn');
      const formData = new FormData(contactForm);
      const firstName = formData.get('firstName') || 'there';

      if (submitBtn) {
        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;
      }

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          if (submitBtn) {
            submitBtn.classList.remove('is-loading');
            submitBtn.classList.add('is-success');
          }

          const modalName = $('#modalName');
          if (modalName) modalName.textContent = firstName;

          setTimeout(() => {
            openModal();
            contactForm.reset();
            if (submitBtn) {
              submitBtn.classList.remove('is-success');
              submitBtn.disabled = false;
            }
          }, 800);
        } else {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Form submission failed');
        }
      } catch (error) {
        console.error('Form error:', error);
        if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.disabled = false;
        }
        alert('Something went wrong. Please try again or email me directly at okerewanjubemeremiracle@gmail.com');
      }
    });
  }

  /* ============================================================
     MODAL FUNCTIONS
     ============================================================ */
  let modalFocusTrap = null;

  window.openModal = function() {
    const modal = $('#thankYouModal');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();

    modalFocusTrap = (e) => {
      if (e.key !== 'Tab') return;
      const elements = Array.from(focusable);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    on(document, 'keydown', modalFocusTrap);
    on(document, 'keydown', handleModalEscape);
  };

  window.closeModal = function() {
    const modal = $('#thankYouModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalFocusTrap) {
      off(document, 'keydown', modalFocusTrap);
      modalFocusTrap = null;
    }
    off(document, 'keydown', handleModalEscape);
  };

  function handleModalEscape(e) {
    if (e.key === 'Escape') closeModal();
  }

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */
  window.toggleFaq = function(button) {
    const item = button.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('is-open');

    // Close all others
    $$('.faq-item.is-open').forEach(openItem => {
      if (openItem !== item) {
        openItem.classList.remove('is-open');
        const btn = openItem.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });

    if (isOpen) {
      item.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
    }
  };

  /* ============================================================
     HERO PARALLAX (Desktop only)
     ============================================================ */
  const hero = $('.hero');
  if (hero && !CONFIG.isTouch && !CONFIG.reducedMotion) {
    const bg = hero.querySelector('.hero-background img');
    const gradient = hero.querySelector('.hero-gradient');

    let currentX = 0, currentY = 0;
    let targetX = 0, targetY = 0;
    let parallaxRaf = null;

    function animateParallax() {
      currentX += (targetX - currentX) * CONFIG.parallaxSmoothing;
      currentY += (targetY - currentY) * CONFIG.parallaxSmoothing;

      // Note: the hero background image is intentionally left alone here.
      // It already has its own CSS keyframe zoom (heroZoom); having JS set
      // an inline transform on it at the same time fought the animation
      // every frame and caused visible micro-stutter. Only the gradient
      // (which has no competing CSS animation) gets the parallax offset.
      if (gradient) {
        gradient.style.transform = `translate(${currentX * 30}px, ${currentY * 30}px)`;
      }

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        parallaxRaf = raf(animateParallax);
      } else {
        parallaxRaf = null;
      }
    }

    on(hero, 'mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5;
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
      if (!parallaxRaf) parallaxRaf = raf(animateParallax);
    });

    on(hero, 'mouseleave', () => {
      targetX = 0;
      targetY = 0;
      if (!parallaxRaf) parallaxRaf = raf(animateParallax);
    });
  }

  /* ============================================================
     ACTIVE NAV LINK HIGHLIGHTING ON SCROLL
     ============================================================ */
  const sections = $$('section[id]');
  if (sections.length && navbar) {
    const sectionNavLinks = navbar.querySelectorAll('.nav-link[href^="#"]');
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          sectionNavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-72px 0px -50% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  /* ============================================================
     BUTTON RIPPLE EFFECT (CSS-driven, performant)
     ============================================================ */
  const rippleBtns = $$('.btn-primary, .btn-secondary, .nav-cta, .form-submit-btn, .contact-method-card');
  rippleBtns.forEach(btn => {
    on(btn, 'click', function(e) {
      if (CONFIG.reducedMotion) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        left:${x}px;top:${y}px;border-radius:50%;
        background:rgba(255,255,255,0.25);transform:scale(0);
        animation:btnRipple 0.5s ease-out;pointer-events:none;
      `;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });

})();
