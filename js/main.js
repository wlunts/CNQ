/* ============================================================
   China Quality Service Co., Ltd. - Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ========== Language Switcher ==========
  // Cache original English values so we can restore them
  document.querySelectorAll('[data-zh]').forEach(function (el) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.setAttribute('data-en', el.placeholder);
    } else if (el.tagName === 'META') {
      el.setAttribute('data-en', el.content);
    } else {
      el.setAttribute('data-en', el.textContent);
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  const storedLang = localStorage.getItem('cnq-lang');
  const currentLang = urlLang || storedLang || 'en';
  applyLanguage(currentLang);

  function applyLanguage(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-zh]').forEach(function (el) {
      if (lang === 'zh') {
        // Switch to Chinese
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = el.getAttribute('data-zh');
        } else if (el.tagName === 'META') {
          el.content = el.getAttribute('data-zh');
        } else {
          el.textContent = el.getAttribute('data-zh');
        }
      } else {
        // Switch to English — restore original values
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = el.getAttribute('data-en') || '';
        } else if (el.tagName === 'META') {
          el.content = el.getAttribute('data-en') || '';
        } else {
          el.textContent = el.getAttribute('data-en') || '';
        }
      }
    });
    // Update lang switch buttons
    document.querySelectorAll('.lang-switch a').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    // Persist language preference, sync URL param for hreflang SEO
    localStorage.setItem('cnq-lang', lang);
    if (lang === 'zh') {
      var url = new URL(window.location);
      url.searchParams.set('lang', 'zh');
      window.history.replaceState(null, '', url);
    } else {
      var urlEn = new URL(window.location);
      urlEn.searchParams.delete('lang');
      window.history.replaceState(null, '', urlEn);
    }
  }

  // Language switch click handlers
  document.querySelectorAll('.lang-switch a').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var lang = this.getAttribute('data-lang');
      if (lang) applyLanguage(lang);
    });
  });

  // ========== Mobile Menu Toggle ==========
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const overlay = document.querySelector('.menu-overlay');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
  }
  if (overlay) {
    overlay.addEventListener('click', function () {
      nav.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
  document.querySelectorAll('.nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (nav.classList.contains('open')) {
        nav.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // ========== Header Scroll Effect ==========
  const header = document.querySelector('.header');
  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      if (currentScroll > 500) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }
    if (header) {
      header.style.boxShadow = currentScroll > 10 ? '0 2px 20px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)';
    }
  });

  // ========== Back to Top Button ==========
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== Smooth Scroll for Anchor Links ==========
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // ========== Scroll Animations (fade-in) ==========
  const fadeElements = document.querySelectorAll('.fade-in');
  const observerOptions = { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.1 };
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  fadeElements.forEach(function (el) { observer.observe(el); });


  // ========== Counter Animation (Stats) ==========
  const statNumbers = document.querySelectorAll('.stat-number');
  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const target = entry.target;
        const targetNum = parseInt(target.getAttribute('data-target'));
        const duration = 2000;
        const startTime = performance.now();
        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(progress * targetNum);
          target.textContent = current + (target.getAttribute('data-suffix') || '');
          if (progress < 1) { requestAnimationFrame(updateCounter); }
          else { target.textContent = targetNum + (target.getAttribute('data-suffix') || ''); }
        }
        requestAnimationFrame(updateCounter);
        counterObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(function (el) { counterObserver.observe(el); });

});
