// About: globo SVG inline (rotación continua + parallax por scroll/cursor), contadores y reveals.
(async () => {
  const svg = await fetch('../assets/globe.svg').then((r) => r.text());
  document.querySelectorAll('[data-globe], [data-globe-small]').forEach((el) => { el.insertAdjacentHTML('afterbegin', svg); });
  const hero = document.querySelector('#heroGlobe');
  if (hero) {
    [['Tondo', '62%', '38%'], ['Cebú', '68%', '58%'], ['Madrid', '14%', '30%']].forEach(([name, x, y]) => {
      const pin = document.createElement('span'); pin.className = 'ab-globe-pin'; pin.textContent = name; pin.style.left = x; pin.style.top = y; pin.style.animationDelay = `${Math.random() * 2}s`; hero.appendChild(pin);
    });
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      let tx = 0, ty = 0, cx = 0, cy = 0;
      addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth - 0.5) * 16; ty = (e.clientY / innerHeight - 0.5) * 16; }, { passive: true });
      const tick = () => { cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06; const s = scrollY * 0.12; hero.querySelector('svg').style.transform = `translate(${cx}px, ${cy + s}px) rotate(${scrollY * 0.02}deg)`; requestAnimationFrame(tick); };
      tick();
    }
  }
  const header = document.querySelector('#abHeader');
  addEventListener('scroll', () => header.classList.toggle('is-solid', scrollY > 40), { passive: true });
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: 0.15 });
  document.querySelectorAll('.ab-reveal').forEach((el) => io.observe(el));
  const counters = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return; counters.unobserve(en.target);
    const target = Number(en.target.dataset.count); const start = performance.now();
    const step = (t) => { const p = Math.min(1, (t - start) / 1200); en.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('es-ES'); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }));
  document.querySelectorAll('[data-count]').forEach((el) => counters.observe(el));
})();
