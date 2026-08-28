// WorldSpeak · cargador de curso.
// Lee ./course.json de la carpeta del curso, lo deja en window.WORLDSPEAK_COURSE
// y entonces carga el reproductor genérico. Así player.js arranca síncrono y
// no contiene nada específico de un idioma.
(async () => {
  const bust = document.currentScript?.dataset.v || String(Date.now());
  // Precarga del reproductor en paralelo (misma URL versionada que usará el <script> de abajo)
  const preload = document.createElement('link'); preload.rel = 'preload'; preload.as = 'script'; preload.href = `../assets/player.js?v=${bust}`; document.head.appendChild(preload);
  try {
    const response = await fetch(`./course.json?v=${bust}`);
    if (!response.ok) throw new Error(`course.json HTTP ${response.status}`);
    window.WORLDSPEAK_COURSE = await response.json();
  } catch (error) {
    document.body.innerHTML = `<main class="shell"><p style="padding:2rem">No se ha podido cargar el curso. ${error.message}</p></main>`;
    return;
  }
  const script = document.createElement('script');
  script.src = `../assets/player.js?v=${bust}`;
  document.body.appendChild(script);
})();
