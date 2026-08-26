// Modal "¿Dónde se habla?": mapa de lenguas de Filipinas con leyenda. Resalta el idioma del curso.
(() => {
  const LANGS = [
    ['cebuano', '#fcd116', 'Bisaya · Cebuano', 'Cebú, Bohol, Siquijor, Negros Oriental, oeste y sur de Leyte, Biliran, Masbate y casi todo Mindanao'],
    ['tagalog', '#1e5eff', 'Tagalog · Filipino', 'Manila y el centro-sur de Luzón, Mindoro, Marinduque, Palawan'],
    ['ilocano', '#8fb4ff', 'Ilocano', 'Norte de Luzón'],
    ['kapampangan', '#b3c9ff', 'Kapampangan · Pangasinán', 'Llanura central de Luzón'],
    ['bicolano', '#5b8dff', 'Bicolano', 'Península de Bicol'],
    ['hiligaynon', '#0d9f6e', 'Hiligaynon · Ilonggo', 'Panay, Negros Occidental, Iloilo'],
    ['waray', '#f28c28', 'Waray', 'Samar, norte y este de Leyte (el oeste y sur de Leyte hablan cebuano)'],
    ['moro', '#d6336c', 'Maguindanao · Maranao · Tausug', 'Suroeste de Mindanao, Sulu'],
    ['chavacano', '#7048e8', 'Chavacano', 'Zamboanga City (criollo del español; el resto de la península, cebuano)'],
  ];
  const course = document.currentScript?.dataset.course || '';
  const highlight = course === 'bisaya' ? 'cebuano' : course.startsWith('tagalog') ? 'tagalog' : '';
  document.querySelectorAll('[data-map]').forEach((btn) => btn.addEventListener('click', open));
  async function open() {
    const svg = await fetch('../assets/mapa-filipinas.svg?v=' + Date.now()).then((r) => r.text());
    const m = document.createElement('div'); m.className = 'phm';
    m.innerHTML = `<div class="phm-panel" role="dialog" aria-modal="true" aria-label="Dónde se habla"><button class="phm-close" type="button" aria-label="Cerrar">×</button>
      <h2>¿Dónde se habla?</h2><p>Las lenguas de Filipinas por islas. ${highlight ? 'Resaltado el idioma de este curso.' : ''}</p>
      <div class="phm-map">${svg}</div>
      <ul class="phm-legend">${LANGS.map(([id, c, n, d]) => `<li class="${id === highlight ? 'is-hl' : ''}"><i style="background:${c}"></i><b>${n}</b><span>${d}</span></li>`).join('')}</ul>
      <p class="phm-note">Toca una región para ver su lengua principal. Filipinas tiene más de 170 lenguas; aquí, las mayoritarias por región.</p></div>`;
    document.body.appendChild(m); document.body.style.overflow = 'hidden';
    const colors = Object.fromEntries(LANGS.map(([id, c]) => [id, c]));
    m.querySelectorAll('[data-lang]').forEach((el) => {
      const id = el.dataset.lang; el.style.fill = colors[id]; if (highlight && id !== highlight) el.style.opacity = '0.45';
      el.addEventListener('click', () => { const L = LANGS.find((x) => x[0] === id); m.querySelector('.phm-note').innerHTML = `<b>${el.dataset.region || ''}</b> → ${L[2]} · ${L[3]}`; });
    });
    const close = () => { m.remove(); document.body.style.overflow = ''; };
    m.querySelector('.phm-close').addEventListener('click', close);
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    window.wsTrack?.('map_open');
  }
})();
