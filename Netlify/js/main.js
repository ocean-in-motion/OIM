// O.I.M. shared behavior — nav toggle, scroll reveals, depth rail readout

(function(){
  // mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    // backdrop so tapping outside the open menu closes it
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    function openMenu(){
      links.classList.add('open');
      backdrop.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closeMenu(){
      links.classList.remove('open');
      backdrop.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      links.classList.contains('open') ? closeMenu() : openMenu();
    });
    backdrop.addEventListener('click', closeMenu);
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') closeMenu();
    });
  }

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0, rootMargin:'0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // depth rail — maps scroll position to a "feet" readout, echoing the
  // sounding-line language used throughout the site's copy
  const rail = document.querySelector('.depth-rail');
  if(rail){
    const fill = rail.querySelector('.fill');
    const readout = rail.querySelector('.readout');
    const track = rail.querySelector('.track');
    const MAX_FT = 1000;

    function update(){
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      fill.style.height = (pct * 100) + '%';
      const trackH = track.offsetHeight;
      readout.style.top = (pct * trackH) + 'px';
      const ft = Math.round(pct * MAX_FT);
      readout.textContent = ft + ' FT';
    }
    update();
    window.addEventListener('scroll', update, { passive:true });
    window.addEventListener('resize', update);
  }
})();
