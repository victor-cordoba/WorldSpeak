// WorldSpeak · cargador de curso.
// Lee ./course.json de la carpeta del curso, lo deja en window.WORLDSPEAK_COURSE
// y entonces carga el reproductor genérico. Así player.js arranca síncrono y
// no contiene nada específico de un idioma.
(async () => {
  const bust = document.currentScript?.dataset.v || String(Date.now());
  try {
    const response = await fetch(`./course.json?v=${bust}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`course.json HTTP ${response.status}`);
    window.WORLDSPEAK_COURSE = await response.json();
  } catch (error) {
    document.body.innerHTML = `<main class="shell"><p style="padding:2rem">No se ha podido cargar el curso. ${error.message}</p></main>`;
    return;
  }
  const version = window.WORLDSPEAK_COURSE.version || bust;
  const script = document.createElement('script');
  script.src = `../assets/player.js?v=${version}`;
  document.body.appendChild(script);
})();
