// WorldSpeak · analítica propia (sin cookies de terceros). window.wsTrack(evento, datos)
(() => {
  const api = document.currentScript?.dataset.api || './api/track.php';
  let sid = null;
  try { sid = localStorage.getItem('ws:sid'); if (!sid) { sid = Math.random().toString(36).slice(2, 14) + Date.now().toString(36); localStorage.setItem('ws:sid', sid); } } catch (_e) { sid = 'anon' + Date.now().toString(36); }
  const session = (() => { try { return JSON.parse(localStorage.getItem('ws:session') || 'null'); } catch (_e) { return null; } })();
  const course = document.currentScript?.dataset.course || '';
  const send = (event, data = {}) => {
    const body = JSON.stringify({ sid, event, page: location.pathname + location.hash, course: data.course || course, track: data.track || '', extra: data.extra || '' });
    try {
      if (session?.token) { fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body, keepalive: true }).catch(() => {}); }
      else if (navigator.sendBeacon) { navigator.sendBeacon(api, new Blob([body], { type: 'application/json' })); }
      else { fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {}); }
    } catch (_e) { /* nunca romper la app por la analítica */ }
  };
  window.wsTrack = send;
  send('pageview');
  addEventListener('hashchange', () => send('pageview'));
  // reproductor: play / pausa / fin / marcar hecha
  const player = document.querySelector('#player');
  if (player) {
    const trackId = () => (new URLSearchParams(location.search).get('track')) || (document.querySelector('#trackTitle')?.textContent || '');
    let played = false;
    player.addEventListener('play', () => { if (!played) { played = true; send('play', { track: trackId() }); } });
    player.addEventListener('ended', () => { played = false; send('ended', { track: trackId() }); });
    document.querySelector('#markDone')?.addEventListener('click', () => send('mark_done', { track: trackId() }));
    document.querySelector('#transcriptToggle')?.addEventListener('click', () => send('read_text', { track: trackId() }));
  }
  document.querySelector('#accountForm')?.addEventListener('submit', () => send('login_attempt'));
  document.querySelector('#customStart')?.addEventListener('click', () => send('quiz_start'));
  document.querySelector('#quizAgain')?.addEventListener('click', () => send('quiz_again'));
  document.addEventListener('click', (e) => { const a = e.target.closest('a.course, a.legacy-row, a.stop, #nextLink'); if (a) send('open', { extra: a.getAttribute('href') || '' }); });
})();
