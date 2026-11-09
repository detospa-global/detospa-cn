(function () {
  var KEY = 'detospa-lang';

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

  /* Language switch: remember the choice and keep the reader on the same section.
     Section ids are identical in every language. */
  function currentSection() {
    var secs = document.querySelectorAll('main section[id]');
    var offset = 90, found = '';
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].getBoundingClientRect().top - offset <= 0) found = secs[i].id;
    }
    return found;
  }
  document.querySelectorAll('a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem(KEY, a.getAttribute('data-lang')); } catch (e) {}
      var base = a.getAttribute('href').split('#')[0];
      var sec = currentSection();
      a.setAttribute('href', sec ? base + '#' + sec : base);
    });
  });

  /* Videos: show a thumbnail; load the YouTube player only when tapped. */
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
