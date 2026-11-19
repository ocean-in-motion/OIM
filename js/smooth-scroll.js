// Icy page scrolling: mouse wheel / trackpad flicks add velocity that coasts and slowly fades.
// Slightly grippier than the Brands carousel. Touch, keyboard, scrollbar drags and anchor links stay native.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  var PUSH = 0.075, FRICTION = 0.955, MAXV = 70;   // cards use 0.09 / 0.975 / 80 (slicker)
  var vel = 0, raf = null, lastT = 0;

  function maxY() { return document.documentElement.scrollHeight - window.innerHeight; }

  // true if something under the cursor can scroll vertically in this direction (chat panel, text areas…)
  function innerCanScroll(el, dir) {
    while (el && el !== document.body && el !== document.documentElement) {
      var cs = getComputedStyle(el);
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function frame(t) {
    var dt = lastT ? Math.max(0.2, Math.min(2.5, (t - lastT) / 16.667)) : 1; lastT = t;
    var y = window.scrollY, mx = maxY(), next = y + vel * dt;
    if (next <= 0 || next >= mx) { next = Math.max(0, Math.min(mx, next)); vel = 0; }
    window.scrollTo({ top: next, left: 0, behavior: 'instant' });
    vel *= Math.pow(FRICTION, dt);
    if (Math.abs(vel) < 0.05) { vel = 0; raf = null; lastT = 0; return; }
    raf = requestAnimationFrame(frame);
  }

  function stop() { vel = 0; }

  window.addEventListener('wheel', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;            // pinch-zoom, or the carousel took it
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    if (innerCanScroll(e.target, dy > 0 ? 1 : -1)) return;               // let inner scrollers scroll
    var y = window.scrollY, mx = maxY();
    if ((dy > 0 && y >= mx - 1) || (dy < 0 && y <= 0)) return;
    e.preventDefault();
    vel = Math.max(-MAXV, Math.min(MAXV, vel + dy * PUSH));
    if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); }
  }, { passive: false });

  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, stop, { passive: true }); });
})();
