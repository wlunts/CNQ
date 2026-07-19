/* ============================================================
   China Quality Service - Main JavaScript
   Unified: language, nav, dropdown, scroll, animations,
   particle canvas, FAQ accordion, font size controls
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

  var urlParams = new URLSearchParams(window.location.search);
  var urlLang = urlParams.get('lang');
  var storedLang = localStorage.getItem('cnq-lang');
  var currentLang = urlLang || storedLang || 'en';
  applyLanguage(currentLang);

  function applyLanguage(lang) {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-zh]').forEach(function (el) {
      if (lang === 'zh') {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = el.getAttribute('data-zh');
        } else if (el.tagName === 'META') {
          el.content = el.getAttribute('data-zh');
        } else {
          el.textContent = el.getAttribute('data-zh');
        }
      } else {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = el.getAttribute('data-en') || '';
        } else if (el.tagName === 'META') {
          el.content = el.getAttribute('data-en') || '';
        } else {
          el.textContent = el.getAttribute('data-en') || '';
        }
      }
    });
    document.querySelectorAll('.lang-switch a').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
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

  document.querySelectorAll('.lang-switch a').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var lang = this.getAttribute('data-lang');
      if (lang) applyLanguage(lang);
    });
  });

  // ========== Mobile Menu Toggle ==========
  var menuToggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  var overlay = document.querySelector('.menu-overlay');

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
      document.querySelectorAll('.nav-dropdown.open').forEach(function (dd) { dd.classList.remove('open'); });
    });
  }
  document.querySelectorAll('.nav > a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (nav.classList.contains('open')) {
        nav.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // ========== Dropdown Menu (Click to toggle) ==========
  document.querySelectorAll('.nav-dropdown > a').forEach(function (dropdownLink) {
    dropdownLink.addEventListener('click', function (e) {
      e.preventDefault();
      var dropdown = this.parentElement;
      var isOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach(function (dd) { dd.classList.remove('open'); });
      if (!isOpen) {
        dropdown.classList.add('open');
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown.open').forEach(function (dd) { dd.classList.remove('open'); });
    }
  });

  document.querySelectorAll('.dropdown-menu a').forEach(function (item) {
    item.addEventListener('click', function () {
      var dropdown = this.closest('.nav-dropdown');
      if (dropdown) dropdown.classList.remove('open');
      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  // ========== Header Scroll Effect ==========
  var header = document.querySelector('.header');
  window.addEventListener('scroll', function () {
    var currentScroll = window.pageYOffset;
    var backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      if (currentScroll > 500) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }
    if (header) {
      header.style.boxShadow = currentScroll > 10 ? '0 2px 20px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)';
    }
  });

  // ========== Back to Top Button ==========
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== Smooth Scroll for Anchor Links ==========
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var headerHeight = header ? header.offsetHeight : 0;
        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // Signal that JavaScript is available for fade-in animations
  document.documentElement.classList.add('js-ready');

  // ========== Scroll Animations (fade-in) ==========
  var fadeElements = document.querySelectorAll('.fade-in');
  var observerOptions = { root: null, rootMargin: '0px 0px 0px 0px', threshold: 0.05 };
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  fadeElements.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });

  // ========== Counter Animation (Stats) ==========
  var statNumbers = document.querySelectorAll('.stat-number');
  var counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var target = entry.target;
        var targetNum = parseInt(target.getAttribute('data-target'));
        var duration = 2000;
        var startTime = performance.now();
        function updateCounter(currentTime) {
          var elapsed = currentTime - startTime;
          var progress = Math.min(elapsed / duration, 1);
          var current = Math.floor(progress * targetNum);
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

  // ========== FAQ Accordion (Services page) ==========
  document.querySelectorAll('.faq-question').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = this.parentElement;
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (i) { i.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ========== Font Size Controls (Article pages) ==========
  window.changeFontSize = function (size) {
    var article = document.getElementById('articleContent');
    if (!article) return;
    if (size === 'small') article.style.fontSize = '0.95rem';
    else if (size === 'medium') article.style.fontSize = '1.05rem';
    else if (size === 'large') article.style.fontSize = '1.2rem';
  };

  // ========== Hero Particle Network Canvas (Home page) ==========
  var canvas = document.getElementById('heroCanvas');
  if (canvas) {
    (function () {
      var ctx = canvas.getContext('2d');
      var particles = [];
      var mouse = { x: -999, y: -999 };
      var PARTICLE_COUNT = 80;
      var CONNECT_DIST = 160;
      var MOUSE_RADIUS = 120;

      function resize() {
        var hero = canvas.parentElement;
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (0.8 + Math.random() * 0.8),
          vy: (Math.random() - 0.5) * (0.8 + Math.random() * 0.8),
          r: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2
        });
      }

      canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      canvas.addEventListener('mouseleave', function () {
        mouse.x = -999;
        mouse.y = -999;
      });

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          var dx = mouse.x - p.x;
          var dy = mouse.y - p.y;
          var distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < MOUSE_RADIUS && mouse.x > 0) {
            var force = (MOUSE_RADIUS - distToMouse) / MOUSE_RADIUS;
            p.x -= dx * force * 0.03;
            p.y -= dy * force * 0.03;
          }

          if (p.x < 0) { p.x = 0; p.vx *= -1; }
          if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -1; }
          if (p.y < 0) { p.y = 0; p.vy *= -1; }
          if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -1; }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + p.opacity + ')';
          ctx.fill();

          for (var j = i + 1; j < particles.length; j++) {
            var p2 = particles[j];
            var dx2 = p.x - p2.x;
            var dy2 = p.y - p2.y;
            var dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist < CONNECT_DIST) {
              var lineOpacity = (1 - dist / CONNECT_DIST) * 0.2;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = 'rgba(255,255,255,' + lineOpacity + ')';
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(draw);
      }
      draw();
    })();
  }

});
