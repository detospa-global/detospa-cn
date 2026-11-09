(function () {
  var KEY = 'detospa-lang';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* Mobile menu */
  var btn = document.getElementById('menu-btn');
  var nav = document.getElementById('mobile-nav');
  if (btn && nav) {
    var openText = btn.getAttribute('data-open') || 'Menu';
    var closeText = btn.getAttribute('data-close') || 'Close';
    var set = function (open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? closeText : openText);
      nav.hidden = !open;
    };
    btn.addEventListener('click', function () { set(nav.hidden); });
    nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });
  }

  /* Language switch: remember the choice and keep the reader on the same section. */
  /* the section that holds the line ~30% down the screen is the one being read */
  function currentSection() {
    if (window.scrollY < 40) return '';
    var y = window.innerHeight * 0.3;
    var secs = document.querySelectorAll('main section[id]');
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) return secs[i].id;
    }
    return '';
  }

  /* arriving with #section (e.g. after a language switch): land on it once the page has laid out */
  if (location.hash.length > 1) {
    var land = function () {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) t.scrollIntoView({ behavior: 'instant', block: 'start' });
    };
    if (document.readyState === 'complete') land(); else window.addEventListener('load', land, { once: true });
  }
  document.querySelectorAll('a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem(KEY, a.getAttribute('data-lang')); } catch (e) {}
      var base = a.getAttribute('href').split('#')[0];
      var sec = currentSection();
      a.setAttribute('href', sec ? base + '#' + sec : base);
    });
  });

  /* Header shadow once the page has scrolled */
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () { head.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Scroll reveal: tag groups once, stagger siblings, reveal when they enter the viewport. */
  var groups = [
    ['.film-card', 0], ['.head > *', .08], ['.about > div > *', .1], ['.about-body > *', .1],
    ['.scenes .ph', .09], ['.pair', .12], ['.diagram', 0], ['.steps li', .08], ['.feat article', .08],
    ['.mcol li', .06], ['.mhub', 0], ['.vhead', 0], ['.voices .voice', .08], ['.qa details', .05],
    ['.specs-img', 0], ['.specs-body > *', .06], ['.caption', 0], ['.fine', 0]
  ];
  if (hasIO && !reduce) {
    var tagged = [];
    groups.forEach(function (g) {
      var els = document.querySelectorAll(g[0]);
      els.forEach(function (el) {
        if (el.classList.contains('rv')) return;
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.classList.add('rv');
        if (g[1]) el.style.setProperty('--d', Math.min(i * g[1], .48) + 's');
        tagged.push(el);
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    tagged.forEach(function (el) { io.observe(el); });
    /* photos zoom out as they appear, but only those inside .ph */
    document.querySelectorAll('.ph').forEach(function (el) { if (!el.classList.contains('rv')) { el.classList.add('rv'); io.observe(el); } });
  }

  /* Current section in the desktop nav */
  var navLinks = document.querySelectorAll('.nav a[href^="#"]');
  if (hasIO && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  /* Cleansing film: loads only near the viewport, plays muted while visible, pauses when not.
     Reduced motion: never autoplays. If the file cannot load, the controls disappear and the photo stays. */
  document.querySelectorAll('[data-player]').forEach(function (box) {
    var v = box.querySelector('video');
    var playBtn = box.querySelector('.p-play');
    var big = box.querySelector('.p-big');
    var sound = box.querySelector('.p-sound');
    var bar = box.querySelector('.p-bar');
    var userPaused = false, loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;
      v.preload = 'metadata';            /* only the header until it actually plays */
      v.src = v.getAttribute('data-src');
    }
    function play() {
      load();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    function sync() {
      var on = !v.paused;
      box.classList.toggle('is-playing', on);
      if (on) box.classList.add('is-started');
      if (playBtn) playBtn.setAttribute('aria-label', playBtn.getAttribute(on ? 'data-label-pause' : 'data-label-play'));
    }
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    v.addEventListener('timeupdate', function () {
      if (bar && v.duration) bar.style.setProperty('--p', (v.currentTime / v.duration).toFixed(4));
    });
    v.addEventListener('error', function () {
      box.classList.remove('is-playing', 'is-started');
      if (box.hasAttribute('data-preview')) { box.classList.add('is-blocked'); return; }  /* preview only: keep the design visible */
      box.classList.add('is-off');
    });

    function toggle() {
      if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); }
    }
    if (playBtn) playBtn.addEventListener('click', toggle);
    if (big) big.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    if (sound) sound.addEventListener('click', function () {
      v.muted = !v.muted;
      sound.setAttribute('aria-pressed', String(!v.muted));
      if (!v.muted && v.paused) { userPaused = false; play(); }
    });

    if (hasIO) {
      /* prepare (header only) once any part of the player is on screen */
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) load();
      }).observe(box);
      /* play only while at least ~half of it is actually on screen */
      if (!reduce) new IntersectionObserver(function (entries) {
        var r = entries[0].intersectionRatio;
        if (r >= .5 && !userPaused) play();
        else if (r < .25 && !v.paused) v.pause();
      }, { threshold: [0, .25, .5, .75] }).observe(box);
    }
  });

  /* Optional YouTube list: thumbnail first, player only on tap. */
  document.querySelectorAll('button.video[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var thumb = b.querySelector('.vthumb');
      if (!thumb || thumb.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.getAttribute('data-yt')) + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      f.title = (b.querySelector('.vtitle') || {}).textContent || 'Video';
      thumb.appendChild(f);
    });
  });
})();
