// WorldSpeak · app de curso propio: Ruta, Frases, Tablas, A medida.
// Genérico: lee ./course.json y ./content/*.json de la carpeta del curso.
const $ = (s) => document.querySelector(s);
const sessionKey = 'ws:session';
let course = null, items = [], pills = [], tables = [], curriculum = null;

function safeJson(v, f) { try { const r = JSON.parse(v); return r === null || r === undefined ? f : r; } catch (_e) { return f; } }
async function getJson(path) { const r = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) throw new Error(path); return r.json(); }

// ---------- progreso (misma clave que player.js) ----------
function loadProgress() { return safeJson(localStorage.getItem(`ws:${course.id}:progress`), { done: [], totalSeconds: 0, lastPlayed: null }) || {}; }
function streak() {
  const days = safeJson(localStorage.getItem(`ws:${course.id}:days`), []);
  const today = new Date().toISOString().slice(0, 10);
  if (!days.includes(today)) { days.push(today); localStorage.setItem(`ws:${course.id}:days`, JSON.stringify(days.slice(-400))); }
  let n = 0; const d = new Date();
  for (;;) { const key = d.toISOString().slice(0, 10); if (!days.includes(key)) break; n += 1; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------- tabs ----------
document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => showTab(btn.dataset.tab)));
function showTab(name) {
  document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.id !== `tab-${name}`; t.classList.toggle('is-active', t.id === `tab-${name}`); });
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === name));
  history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0 });
}

// ---------- ruta ----------
function renderRoute() {
  const p = loadProgress();
  const done = new Set(p.done || []);
  const hasAudio = new Set((course.tracks || []).map((t) => t.id));
  const route = $('#route'); route.innerHTML = '';
  let next = null;
  curriculum.levels.forEach((level) => {
    const wrap = document.createElement('div'); wrap.className = 'level';
    wrap.innerHTML = `<div class="level-head"><span class="level-icon">${level.icon}</span><div><h2>Nivel ${level.id} · ${level.title}</h2><p>${level.desc}</p></div></div>`;
    curriculum.lessons.filter((l) => l.level === level.id).forEach((l) => {
      const isDone = done.has(l.id);
      const live = hasAudio.has(l.id);
      const isNext = !next && !isDone && live;
      if (isNext) next = l;
      const el = document.createElement(live ? 'a' : 'div');
      el.className = `stop ${isDone ? 'is-done' : ''} ${isNext ? 'is-next' : ''} ${!live ? 'is-soon' : ''}`;
      el.dataset.num = String(l.lesson);
      if (live) el.href = `./player.html?track=${l.id}`;
      const hasItems = items.some((i) => i.lesson === l.lesson);
      el.innerHTML = `<div><strong>${l.title}</strong><em>${l.items.slice(0, 3).join(' · ')}</em></div><span class="stop-actions"><span class="stop-cta ${live ? 'stop-play' : ''}" aria-label="${isDone ? 'Repetir' : 'Escuchar'}">${live ? '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>' : '🔒'}</span></span>`;
      el.querySelector('[data-practice]')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); practiceLesson(l.lesson); });
      wrap.appendChild(el);
    });
    route.appendChild(wrap);
  });
  const tests = (course.tracks || []).filter((t) => t.kind === 'test');
  if (tests.length) {
    const wrap = document.createElement('div'); wrap.className = 'level';
    wrap.innerHTML = `<div class="level-head"><span class="level-icon">🎙️</span><div><h2>Pruebas de voz</h2><p>Misma lección, distinto proveedor. Compara y elige.</p></div></div>`;
    tests.forEach((t) => { const el = document.createElement('a'); el.className = 'stop'; el.dataset.num = '🎙'; el.href = `./player.html?track=${t.id}`; el.innerHTML = `<div><strong>${t.copy?.title || t.title}</strong><em>${t.copy?.subtitle || ''}</em></div><span class="stop-cta">Escuchar</span>`; wrap.appendChild(el); });
    route.appendChild(wrap);
  }
  // Netflix: si hay un último punto, se continúa ahí
  const last = p.lastPlayed && curriculum.lessons.find((l) => l.id === p.lastPlayed.id);
  const target = (last && !done.has(last.id) && last) || next || curriculum.lessons[0];
  const resume = last && target === last && p.lastPlayed.position > 20;
  const mm = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  $('#nextEyebrow').textContent = `LECCIÓN ${target.lesson}`;
  $('#nextTitle').textContent = target.title;
  const pct = resume && p.lastPlayed.duration ? Math.min(99, Math.round((p.lastPlayed.position / p.lastPlayed.duration) * 100)) : 0;
  $('#nextMetaText').innerHTML = resume ? `<span class="hero-progress"><i style="width:${pct}%"></i></span> vas por el minuto ${mm(p.lastPlayed.position)}` : `Nivel ${target.level} · 15 min${hasAudio.has(target.id) ? '' : ' · audio en preparación'}`;
  const pm = $('#practiceMeta'); if (pm) pm.textContent = `Frases de la lección ${target.lesson}: ${target.title}`;
  $('#nextLink').href = hasAudio.has(target.id) ? `./player.html?track=${target.id}` : '#frases';
  $('#nextLink').textContent = resume ? '▶ Continuar' : hasAudio.has(target.id) ? '▶ Empezar' : '💬 Ver las frases';
  if (!hasAudio.has(target.id)) $('#nextLink').addEventListener('click', (e) => { e.preventDefault(); showTab('frases'); });
  $('#nextPractice').onclick = () => practiceLesson(target.lesson);
  $('#statDone').textContent = String(done.size);
  $('#statStreak').textContent = String(streak());
}

// ---------- frases ----------
let activePill = 'all';
function renderPills(container, onPick, multi = false, selected = new Set()) {
  container.innerHTML = '';
  const all = multi ? [] : [{ id: 'all', icon: '✨', title: 'Todo' }];
  all.concat(pills).forEach((pill) => {
    const count = pill.id === 'all' ? items.length : items.filter((i) => i.pill === pill.id).length;
    if (!count) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pill';
    b.innerHTML = `${pill.icon} ${pill.title} <small>${count}</small>`;
    b.classList.toggle('is-active', multi ? selected.has(pill.id) : activePill === pill.id);
    b.addEventListener('click', () => onPick(pill.id, b));
    container.appendChild(b);
  });
}
function renderPhrases() {
  const q = ($('#phraseSearch').value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const grid = $('#phraseGrid'); grid.innerHTML = '';
  const list = items.filter((i) => (activePill === 'all' || i.pill === activePill) && (!q || `${i.tl} ${i.es} ${i.note}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)));
  if (!list.length) { grid.innerHTML = '<p class="empty">Nada por aquí todavía. Prueba otro tema.</p>'; return; }
  list.forEach((i) => {
    const pill = pills.find((p) => p.id === i.pill);
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="card-inner" role="button" tabindex="0" aria-label="${i.tl}. Toca para ver el español">
      <div class="card-face card-front"><span class="card-tag">${pill ? pill.icon + ' ' + pill.title : ''}</span><strong>${i.tl}</strong>${i.lit ? `<span class="lit">${i.lit}</span>` : ''}<button class="card-play" type="button" aria-label="Escuchar" ${audioMap[normText(i.tl)] ? '' : 'disabled title="Audio en preparación"'}>▶</button></div>
      <div class="card-face card-back"><span class="card-tag">L${i.lesson}</span><span class="es">${i.es}</span>${i.note ? `<span class="note">${i.note}</span>` : ''}</div></div>`;
    const inner = card.querySelector('.card-inner');
    const flip = (e) => { if (e.target.closest('.card-play')) return; card.classList.toggle('is-flipped'); };
    card.querySelector('.card-play')?.addEventListener('click', (e) => { e.stopPropagation(); playClip(i.tl, e.currentTarget); });
    inner.addEventListener('click', flip);
    inner.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(e); } });
    grid.appendChild(card);
  });
}

// ---------- tablas ----------
function renderTables() {
  const wrap = $('#tables'); wrap.innerHTML = '';
  tables.forEach((t, idx) => {
    const d = document.createElement('details'); d.className = 'tbl'; if (idx === 0) d.open = true;
    const head = t.columns.map((c) => `<th>${c}</th>`).join('');
    const rows = t.rows.map((r) => `<tr>${r.map((c, ci) => `<td class="${ci === 1 || (t.columns[ci] || '').toLowerCase().includes('tagalog') ? 'tl' : ''}">${c}</td>`).join('')}</tr>`).join('');
    d.innerHTML = `<summary><span class="n">${idx + 1}</span><div><strong>${t.title}</strong><em>${t.kicker || ''}</em></div></summary>
      <div class="tbl-body">${t.intro ? `<p class="intro">${t.intro}</p>` : ''}<div class="tbl-scroll"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
      ${t.notes?.length ? `<ul class="tbl-notes">${t.notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : ''}</div>`;
    wrap.appendChild(d);
  });
  $('#printTables').addEventListener('click', () => { document.querySelectorAll('.tbl').forEach((d) => { d.open = true; }); window.print(); });
}

// ---------- a medida: repaso por anticipación ----------
const chosen = new Set(['preguntar', 'entender']);
let deck = [], pos = 0, hard = [];
let scenes = {};
let audioMap = {};
const normText = (t) => String(t || '').toLowerCase().replace(/[¿¡!?.,…]+/g, '').replace(/\s+/g, ' ').trim();
let currentClip = null;
function playClip(text, button) {
  const src = audioMap[normText(text)];
  if (!src) return false;
  if (currentClip) { currentClip.pause(); }
  currentClip = new Audio(`./${src}`);
  button?.classList.add('is-playing');
  currentClip.addEventListener('ended', () => button?.classList.remove('is-playing'));
  currentClip.play().catch(() => button?.classList.remove('is-playing'));
  window.wsTrack?.('clip', { extra: text.slice(0, 60) });
  return true;
}
function renderCustom() {
  renderPills($('#customPills'), (id, b) => { chosen.has(id) ? chosen.delete(id) : chosen.add(id); b.classList.toggle('is-active', chosen.has(id)); }, true, chosen);
}
function practiceLesson(lessonNumber) {
  const pool = items.filter((i) => i.lesson === lessonNumber);
  if (!pool.length) { showTab('frases'); return; }
  chosen.clear(); pool.forEach((i) => chosen.add(i.pill));
  renderCustom();
  showTab('medida');
  document.querySelector('[data-medida="repaso"]')?.click();
  runQuiz(pool, Math.min(pool.length, 12));
}
function startQuiz() {
  const pool = items.filter((i) => chosen.has(i.pill));
  if (!pool.length) { alert('Elige al menos un tema.'); return; }
  runQuiz(pool, Number($('#customCount').value));
}
function runQuiz(pool, n) {
  deck = [...pool].sort(() => Math.random() - 0.5).slice(0, n); pos = 0; hard = [];
  $('#quiz').hidden = false; $('#quizDone').hidden = true; showCard();
  $('#quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function showCard() {
  const i = deck[pos];
  $('#quizBar').style.width = `${(pos / deck.length) * 100}%`;
  $('#quizEs').textContent = i.es; $('#quizTl').textContent = i.tl; $('#quizNote').textContent = i.note || i.lit || '';
  $('#quizAnswer').hidden = true; $('#quizReveal').hidden = false; $('#quizJudge').hidden = true;
}
function reveal() { $('#quizAnswer').hidden = false; $('#quizReveal').hidden = true; $('#quizJudge').hidden = false; playClip(deck[pos].tl, null); }
function judge(wasHard) {
  if (wasHard) hard.push(deck[pos]);
  pos += 1;
  if (pos < deck.length) { showCard(); return; }
  $('#quizBar').style.width = '100%'; $('#quiz').hidden = true; $('#quizDone').hidden = false;
  $('#quizSummary').textContent = `${deck.length - hard.length} de ${deck.length} sabidas.${hard.length ? ` Repasa: ${hard.map((h) => h.tl).join(', ')}` : ' ¡Todas!'}`;
  const key = `ws:${course.id}:hard`; const prev = safeJson(localStorage.getItem(key), []);
  localStorage.setItem(key, JSON.stringify([...new Set([...prev, ...hard.map((h) => h.id)])]));
}
function renderDialogues() {
  const wrap = $('#dialogueList'); if (!wrap) return; wrap.innerHTML = '';
  Object.entries(scenes).forEach(([id, sc]) => {
    const lesson = curriculum.lessons.find((l) => l.id === `${id}-main`);
    const d = document.createElement('details'); d.className = 'dlg';
    d.innerHTML = `<summary><span class="lesson-pill">${lesson ? 'L' + lesson.lesson : id}</span><strong>${lesson ? lesson.title : id}</strong><em>${sc.setting}</em></summary>
      <div class="dlg-lines">${(() => { const order = []; return sc.lines.map((l) => { if (!order.includes(l.role)) order.push(l.role); const side = order.indexOf(l.role) % 2 ? 'is-f' : 'is-m'; const has = audioMap[normText(l.tl)]; return `<button type="button" class="dlg-line ${side}" data-tl="${l.tl.replace(/"/g, '&quot;')}"><b>${l.tl}</b><span>${l.es}</span>${has ? '<i class="dlg-play" aria-hidden="true">▶</i>' : ''}</button>`; }).join(''); })()}</div>
      <p class="dlg-tip">Toca una línea para ver la traducción. Léela en voz alta antes de mirar.</p>`;
    d.querySelectorAll('.dlg-line').forEach((b) => b.addEventListener('click', () => { b.classList.toggle('is-open'); playClip(b.dataset.tl, b); }));
    wrap.appendChild(d);
  });
}
document.querySelectorAll('[data-medida]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-medida]').forEach((x) => x.classList.toggle('is-active', x === b));
  document.querySelectorAll('[data-medida-panel]').forEach((p) => { p.hidden = p.dataset.medidaPanel !== b.dataset.medida; });
}));
$('#customStart').addEventListener('click', startQuiz);
$('#quizReveal').addEventListener('click', reveal);
$('#quizHard').addEventListener('click', () => judge(true));
$('#quizEasy').addEventListener('click', () => judge(false));
$('#quizAgain').addEventListener('click', startQuiz);
document.addEventListener('keydown', (e) => { if ($('#quiz').hidden) return; if (e.key === ' ' && !$('#quizReveal').hidden) { e.preventDefault(); reveal(); } if (e.key === '1' && $('#quizReveal').hidden) judge(true); if (e.key === '2' && $('#quizReveal').hidden) judge(false); });

// ---------- boot ----------
(async () => {
  try {
    [course, curriculum] = await Promise.all([getJson('./course.json'), getJson('./content/curriculum.json')]);
    const [it, pi, ta] = await Promise.all([getJson('./content/items.json'), getJson('./content/pills.json'), getJson('./content/tables.json')]);
    items = it.items; pills = pi.pills; tables = ta.tables;
    try { scenes = (await getJson('./content/scenes.json')).scenes || {}; } catch (_e) { scenes = {}; }
    try { audioMap = await getJson('./content/audio-map.json'); } catch (_e) { audioMap = {}; }
  } catch (error) { $('#app').innerHTML = `<p class="empty">No se ha podido cargar el curso (${error.message}).</p>`; return; }
  $('#courseTitle').textContent = course.shortTitle || course.title;
  renderRoute();
  renderPills($('#pillBar'), pickPill);
  renderPhrases();
  $('#phraseSearch').addEventListener('input', renderPhrases);
  renderTables();
  renderCustom();
  renderDialogues();
  const hash = location.hash.replace('#', '');
  if (['ruta', 'frases', 'tablas', 'medida'].includes(hash)) showTab(hash);
})();
function pickPill(id) { activePill = id; renderPhrases(); renderPills($('#pillBar'), pickPill); }
