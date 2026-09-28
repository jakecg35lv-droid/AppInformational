/* ══════════════════════════════════════════════════════════
   TIPOFF FANTASY — site motion
   Scroll reveals + count-up numbers, shared by every page.

   Was inline on index.html only, which meant the homepage had
   motion and every other page felt dead by comparison. One file,
   loaded everywhere, keeps them consistent.

   Fails open by design: the .reveal styles only hide content under
   html.js, and that class is set by a tiny inline script in <head>.
   If this file never loads, the page renders fully visible.
══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ── Mobile menu ──────────────────────────────────────
     Below 700px the nav links are hidden by CSS. Without this the
     rest of the site is unreachable from a phone. */
  ready(function () {
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    function open() {
      menu.hidden = false;
      // Next frame, so the transition has a start state to animate from.
      requestAnimationFrame(function () { menu.classList.add('open'); });
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');
    }

    function close() {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
      // Wait for the fade before hiding, or it snaps shut.
      setTimeout(function () {
        if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true;
      }, 260);
    }

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') close(); else open();
    });

    // Tapping a link navigates; close first so a back-button return
    // does not land on an open menu.
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        close();
        toggle.focus();
      }
    });

    // Rotating to landscape can cross the 700px breakpoint and leave a
    // menu open over a nav that is visible again.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 700 && toggle.getAttribute('aria-expanded') === 'true') close();
    });
  });

  ready(function () {
    var items = [].slice.call(document.querySelectorAll('.reveal'));

    // Reduced motion, or a browser without IntersectionObserver:
    // show everything at once and settle the counters immediately.
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      [].slice.call(document.querySelectorAll('[data-count-to]')).forEach(function (el) {
        el.textContent = el.getAttribute('data-count-to');
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () {
          el.classList.add('in');
          countWithin(el);
        }, delay);
        io.unobserve(el);            // reveal once; never re-hide on scroll up
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });

    function countWithin(scope) {
      var nums = (scope.matches && scope.matches('[data-count-to]'))
        ? [scope]
        : [].slice.call(scope.querySelectorAll('[data-count-to]'));
      nums.forEach(animateCount);
    }

    function animateCount(el) {
      if (el.dataset.counted) return;   // guard against a second observer hit
      el.dataset.counted = '1';

      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var duration = 1100;
      var start = null;

      function frame(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        // easeOutExpo — quick off the line, lands softly on the number
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  });
})();
