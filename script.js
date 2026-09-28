(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Accessibility bar: A-/A+ и версия для слабовидящих ---------------- */
  var root = document.documentElement;
  var SCALE_KEY = 'popeyko_font_scale';
  var CONTRAST_KEY = 'popeyko_contrast';
  var scale = parseFloat(localStorage.getItem(SCALE_KEY)) || 1;
  var MIN_SCALE = 0.9, MAX_SCALE = 1.4, STEP = 0.1;

  function applyScale() {
    root.style.setProperty('--font-scale', scale.toFixed(2));
    root.classList.toggle('a11y-large', scale !== 1);
  }
  applyScale();

  var decBtn = document.getElementById('a-dec');
  var incBtn = document.getElementById('a-inc');
  var contrastBtn = document.getElementById('a-contrast');

  if (decBtn) decBtn.addEventListener('click', function () {
    scale = Math.max(MIN_SCALE, +(scale - STEP).toFixed(2));
    localStorage.setItem(SCALE_KEY, scale);
    applyScale();
  });
  if (incBtn) incBtn.addEventListener('click', function () {
    scale = Math.min(MAX_SCALE, +(scale + STEP).toFixed(2));
    localStorage.setItem(SCALE_KEY, scale);
    applyScale();
  });

  if (localStorage.getItem(CONTRAST_KEY) === '1') {
    root.classList.add('a11y-contrast');
    if (contrastBtn) contrastBtn.setAttribute('aria-pressed', 'true');
  }
  if (contrastBtn) contrastBtn.addEventListener('click', function () {
    var on = root.classList.toggle('a11y-contrast');
    contrastBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    localStorage.setItem(CONTRAST_KEY, on ? '1' : '0');
  });

  /* ---------------- FAQ accordion ---------------- */
  var faqButtons = document.querySelectorAll('.faq-q');
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (panel) panel.hidden = expanded;
      var toggle = btn.querySelector('.faq-toggle');
      if (toggle) toggle.textContent = expanded ? '+' : '–';
    });
  });

  /* ---------------- Reveal-on-scroll (IntersectionObserver) ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------- Hover-эффекты и по касанию ---------------- */
  var touchTargets = document.querySelectorAll('.cta, .service-card, .doc-card, .review-card, .cred-card, .contact-card');
  touchTargets.forEach(function (el) {
    el.addEventListener('touchstart', function () { el.classList.add('touch-active'); }, { passive: true });
    el.addEventListener('touchend', function () {
      setTimeout(function () { el.classList.remove('touch-active'); }, 250);
    }, { passive: true });
  });

  /* ---------------- Desktop interactive spotlight reveal ---------------- */
  var wrap = document.getElementById('revealBg');
  var topLayer = wrap ? wrap.querySelector('.reveal-bg__top') : null;
  var gridSvg = document.getElementById('revealGrid');
  var isDesktop = window.matchMedia('(min-width: 1024px)').matches;

  if (wrap && topLayer && isDesktop && !reduceMotion) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var smooth = { x: mouse.x, y: mouse.y };
    var parallax = { x: 0, y: 0 };
    var raf = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function radius() {
      return Math.round(Math.min(420, Math.max(160, window.innerWidth * 0.16)));
    }

    function tick() {
      smooth.x += (mouse.x - smooth.x) * 0.1;
      smooth.y += (mouse.y - smooth.y) * 0.1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var r = radius();
      var grad = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, r);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,1)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.75)');
      grad.addColorStop(0.75, 'rgba(255,255,255,0.4)');
      grad.addColorStop(0.88, 'rgba(255,255,255,0.12)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var url = canvas.toDataURL();
      topLayer.style.maskImage = 'url(' + url + ')';
      topLayer.style.webkitMaskImage = 'url(' + url + ')';

      if (gridSvg) {
        var cell = Math.round(Math.min(64, Math.max(36, window.innerWidth * 0.028)));
        var cx = (smooth.x / window.innerWidth) - 0.5;
        var cy = (smooth.y / window.innerHeight) - 0.5;
        parallax.x += (cx * 16 - parallax.x) * 0.06;
        parallax.y += (cy * 16 - parallax.y) * 0.06;
        var pattern = gridSvg.querySelector('#gridPattern');
        if (pattern) {
          pattern.setAttribute('width', cell);
          pattern.setAttribute('height', cell);
          pattern.setAttribute('x', parallax.x);
          pattern.setAttribute('y', parallax.y);
          var path = pattern.querySelector('path');
          if (path) path.setAttribute('d', 'M ' + cell + ' 0 L 0 0 0 ' + cell);
        }
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  } else if (wrap && isDesktop) {
    /* prefers-reduced-motion: показать статично, без анимации маски */
    if (topLayer) { topLayer.style.opacity = '0.12'; }
  }

  /* ---------------- Toast (для контактных ссылок) ---------------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 3000);
  }
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () { showToast('Открываем почтовый клиент…'); });
  });
})();
