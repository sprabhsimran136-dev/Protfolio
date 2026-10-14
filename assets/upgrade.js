(() => {
  const root = document.documentElement;
  const KEY = 'theme';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- Theme: apply saved choice immediately (dark is the default) -----
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  root.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');

  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();

  ready(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const syncMeta = () => meta && meta.setAttribute('content', root.dataset.theme === 'light' ? '#f5f4fa' : '#09090d');
    syncMeta();

    // ----- Toggle button -----
    const nav = document.querySelector('.nav-wrap');
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.innerHTML =
      '<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
    const label = () => {
      const light = root.dataset.theme === 'light';
      btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
      btn.setAttribute('aria-pressed', String(light));
      btn.title = light ? 'Dark mode' : 'Light mode';
    };
    label();
    const menu = nav.querySelector('.menu-toggle');
    nav.insertBefore(btn, window.innerWidth <= 680 && menu ? menu : null);
    addEventListener('resize', () => {
      const m = window.innerWidth <= 680 && menu;
      if (m && btn.nextElementSibling !== menu) nav.insertBefore(btn, menu);
      if (!m && btn.parentNode === nav && nav.lastElementChild !== btn) nav.appendChild(btn);
    });

    const apply = next => {
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      syncMeta(); label();
    };
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      if (document.startViewTransition && !reduce) {
        const r = btn.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        document.startViewTransition(() => apply(next)).ready.then(() => {
          root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' });
        }).catch(() => {});
      } else {
        root.classList.add('theme-anim');
        apply(next);
        setTimeout(() => root.classList.remove('theme-anim'), 500);
      }
    });

    // ----- Photo: nav avatar + hero portrait -----
    const SRC = 'assets/prabh.jpg';
    const mark = document.querySelector('.brand-mark');
    if (mark) mark.innerHTML = `<img src="${SRC}" alt="" width="34" height="34">`;

    const wrap = document.querySelector('.terminal-wrap');
    let pic = null;
    if (wrap) {
      pic = document.createElement('figure');
      pic.className = 'pic';
      pic.innerHTML =
        '<div class="pic-ring"></div>' +
        `<div class="pic-frame"><img src="${SRC}" alt="Portrait of Prabh Simran" width="560" height="700" fetchpriority="high"></div>` +
        '<figcaption class="pic-chip"><span class="availability-dot"></span>Delhi, India</figcaption>';
      wrap.prepend(pic);
    }

    // ----- Motion -----
    const bar = document.createElement('div');
    bar.className = 'progress';
    document.body.appendChild(bar);
    const onScroll = () => {
      const h = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(scrollY / h, 1) : 0})`;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!reduce && matchMedia('(hover: hover)').matches) {
      // cursor spotlight
      const spot = document.createElement('div');
      spot.className = 'spot';
      document.body.appendChild(spot);
      let px = 0, py = 0, ticking = false;
      addEventListener('pointermove', e => {
        px = e.clientX; py = e.clientY;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => { spot.style.setProperty('--x', px + 'px'); spot.style.setProperty('--y', py + 'px'); ticking = false; });
        }
      }, { passive: true });

      // 3D tilt on the portrait
      if (pic) {
        wrap.addEventListener('pointermove', e => {
          const r = pic.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
          const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          pic.style.transform = `perspective(900px) rotateY(${dx * 9}deg) rotateX(${-dy * 9}deg)`;
        });
        wrap.addEventListener('pointerleave', () => { pic.style.transform = ''; });
      }
    }

    // highlight current section in nav
    const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting && map.has(e.target.id)) {
          links.forEach(a => a.removeAttribute('aria-current'));
          map.get(e.target.id).setAttribute('aria-current', 'location');
        }
      }), { rootMargin: '-45% 0px -50% 0px' });
      map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
  });
})();
