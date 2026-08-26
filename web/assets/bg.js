// Fondo vivo: inserta las manchas y actualiza --ws-scroll con el desplazamiento (parallax barato).
(() => {
  const bg = document.createElement('div'); bg.className = 'ws-bg'; bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = '<span class="b1"></span><span class="b2"></span><span class="b3"></span><span class="b4"></span>';
  document.body.prepend(bg); document.body.classList.add('has-live-bg');
  let ticking = false;
  const update = () => { document.documentElement.style.setProperty('--ws-scroll', String(scrollY)); ticking = false; };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
