// WorldSpeak · hub. Lista los cursos, muestra el progreso de la cuenta en cada
// uno y comparte la sesión (ws:session) con los reproductores de cada curso.
const apiEndpoint = './api/index.php';
const sessionKey = 'ws:session';

const courseList = document.querySelector('#courseList');
const legacyList = document.querySelector('#legacyList');
const hubCourses = document.querySelector('#hubCourses');
const hubDone = document.querySelector('#hubDone');
const hubTime = document.querySelector('#hubTime');
const accountToggle = document.querySelector('#accountToggle');
const accountInitial = document.querySelector('#accountInitial');
const accountLabel = document.querySelector('#accountLabel');
const accountMeta = document.querySelector('#accountMeta');
const accountModal = document.querySelector('#accountModal');
const accountClose = document.querySelector('#accountClose');
const accountForm = document.querySelector('#accountForm');
const accountName = document.querySelector('#accountName');
const accountPin = document.querySelector('#accountPin');
const pinDots = [...document.querySelectorAll('#pinDots span')];
const pinPad = document.querySelector('#pinPad');
const accountStatus = document.querySelector('#accountStatus');
const accountLogged = document.querySelector('#accountLogged');
const accountNameLabel = document.querySelector('#accountNameLabel');
const accountLogout = document.querySelector('#accountLogout');

let courses = [];
let session = safeJsonParse(localStorage.getItem(sessionKey), null);
let overview = new Map();

function safeJsonParse(value, fallback) {
  try { return JSON.parse(value); } catch (_error) { return fallback; }
}

function saveSession(next) {
  session = next && next.token && next.user ? next : null;
  if (session) localStorage.setItem(sessionKey, JSON.stringify(session));
  else localStorage.removeItem(sessionKey);
}

async function api(action, payload = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  const response = await fetch(apiEndpoint, { method: 'POST', headers, body: JSON.stringify({ action, ...payload }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'No se ha podido conectar.');
  return data;
}

function formatStudyTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  if (total < 3600) return `${Math.round(total / 60)} min`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

// Progreso local de un curso (por si no hay cuenta): misma clave que usa player.js
function localProgress(courseId) {
  const state = safeJsonParse(localStorage.getItem(`ws:${courseId}:progress`), null);
  if (!state) return null;
  return {
    doneCount: Array.isArray(state.done) ? state.done.length : 0,
    totalSeconds: Number(state.totalSeconds) || 0,
    lastTrack: state.lastPlayed?.id || null,
    lastPosition: Number(state.lastPlayed?.position) || 0
  };
}

function progressFor(courseId) {
  return overview.get(courseId) || localProgress(courseId);
}

function flag(code) {
  const flags = { ph: '🇵🇭', es: '🇪🇸', fr: '🇫🇷', it: '🇮🇹', de: '🇩🇪', pt: '🇧🇷', jp: '🇯🇵', kr: '🇰🇷', cn: '🇨🇳' };
  return flags[code] || '🌍';
}

function ring(pct) {
  const r = 22, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="${r}"/><circle class="ring-fg" cx="28" cy="28" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/><text x="28" y="32" text-anchor="middle">${pct}%</text></svg>`;
}
function renderCourses() {
  courseList.innerHTML = ''; legacyList.innerHTML = '';
  let totalDone = 0, totalSeconds = 0, active = 0;
  courses.forEach((course) => {
    if (course.legacy) { renderLegacy(course); const pr = progressFor(course.id); if (pr) { totalDone += pr.doneCount; totalSeconds += pr.totalSeconds; if (pr.doneCount || pr.totalSeconds) active += 1; } return; }
    const progress = progressFor(course.id);
    const isLive = course.status === 'live';
    const card = document.createElement(isLive ? 'a' : 'article');
    card.className = `course ${isLive ? '' : 'is-soon'} ${progress?.doneCount || progress?.totalSeconds ? 'has-progress' : ''}`;
    if (isLive) card.href = course.path;
    const pct = progress && course.tracks ? Math.min(100, Math.round((progress.doneCount / course.tracks) * 100)) : 0;
    const started = progress && (progress.doneCount || progress.totalSeconds || progress.lastTrack);
    const meta = !isLive ? 'En preparación' : started ? `${progress.doneCount} de ${course.tracks} lecciones · ${formatStudyTime(progress.totalSeconds)}` : `${course.tracks} lecciones · ${course.hours} h de audio`;
    const cta = !isLive ? 'Pronto' : started ? 'Continuar' : 'Empezar';
    card.innerHTML = `
      <div class="course-band"><span class="course-flag">${flag(course.language?.flag)}</span></div>
      <div class="course-body">
        <div class="course-head"><h3>${course.title}</h3><span class="course-chip">${course.subtitle || ''}</span></div>
        <p>${course.description || ''}</p>
        <div class="course-foot">
          ${isLive ? ring(pct) : '<span class="ring ring-soon">…</span>'}
          <span class="course-meta">${meta}</span>
          <span class="course-cta">${cta} <i>→</i></span>
        </div>
      </div>`;
    courseList.appendChild(card);
    if (progress) { totalDone += progress.doneCount; totalSeconds += progress.totalSeconds; if (progress.doneCount || progress.totalSeconds) active += 1; }
  });
  hubCourses.textContent = String(active);
  hubDone.textContent = String(totalDone);
  hubTime.textContent = formatStudyTime(totalSeconds);
}

function renderLegacy(course) {
  const progress = progressFor(course.id);
  const started = progress && (progress.doneCount || progress.totalSeconds || progress.lastTrack);
  const row = document.createElement('a'); row.className = 'legacy-row'; row.href = course.path;
  row.innerHTML = `<span class="legacy-flag">${flag(course.language?.flag)}</span><span class="legacy-copy"><strong>${course.title}</strong><em>${course.subtitle}</em>${started ? `<small>${progress.doneCount} de ${course.tracks} · ${formatStudyTime(progress.totalSeconds)}</small>` : ''}</span><span class="legacy-cta">${started ? 'Continuar' : 'Abrir'} →</span>`;
  legacyList.appendChild(row);
}

function updateAccountUi() {
  const name = session?.user?.name || '';
  accountInitial.textContent = name ? name.slice(0, 1).toUpperCase() : '?';
  accountLabel.textContent = name || 'Entrar';
  accountMeta.textContent = name ? 'Progreso sincronizado' : 'Guardar progreso';
  accountLogged.hidden = !name;
  accountForm.hidden = Boolean(name);
  accountLogout.hidden = !name;
  accountNameLabel.textContent = name;
}

function setStatus(message, tone = '') {
  accountStatus.textContent = message;
  accountStatus.dataset.tone = tone;
}

function sanitizePin(value) { return String(value || '').replace(/\D/g, '').slice(0, 4); }
function updatePinDots() {
  const length = sanitizePin(accountPin.value).length;
  pinDots.forEach((dot, index) => dot.classList.toggle('is-filled', index < length));
}

function openAccount() { accountModal.hidden = false; document.body.classList.add('modal-open'); accountToggle.setAttribute('aria-expanded', 'true'); if (accountForm.hidden === false) accountName.focus(); }
function closeAccount() { accountModal.hidden = true; document.body.classList.remove('modal-open'); accountToggle.setAttribute('aria-expanded', 'false'); }

async function restoreSession() {
  if (!session?.token) { updateAccountUi(); return; }
  try {
    const data = await api('overview');
    saveSession({ token: session.token, user: data.user });
    overview = new Map((data.courses || []).map((row) => [row.course, row]));
  } catch (_error) {
    saveSession(null);
    overview = new Map();
  }
  updateAccountUi();
  renderCourses();
}

accountToggle.addEventListener('click', openAccount);
accountClose.addEventListener('click', closeAccount);
accountModal.addEventListener('click', (event) => { if (event.target.matches('[data-account-close]')) closeAccount(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !accountModal.hidden) closeAccount(); });
accountPin.addEventListener('input', () => { accountPin.value = sanitizePin(accountPin.value); updatePinDots(); });
pinPad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.pinKey !== undefined) accountPin.value = sanitizePin(accountPin.value + button.dataset.pinKey);
  if (button.hasAttribute('data-pin-clear')) accountPin.value = '';
  if (button.hasAttribute('data-pin-back')) accountPin.value = accountPin.value.slice(0, -1);
  updatePinDots();
});

accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = accountName.value.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, 80);
  const pin = sanitizePin(accountPin.value);
  if (!name || pin.length !== 4) { setStatus('Escribe un nombre y un PIN de 4 números.', 'error'); return; }
  setStatus('Entrando...', '');
  try {
    const data = await api('login', { name, pin });
    saveSession({ token: data.token, user: data.user });
    overview = new Map((data.courses || []).map((row) => [row.course, row]));
    accountPin.value = ''; updatePinDots();
    setStatus('Listo. Tu progreso te sigue en todos los idiomas.', 'ok');
    updateAccountUi(); renderCourses();
  } catch (error) {
    setStatus(error.message || 'No se ha podido entrar.', 'error');
  }
});

accountLogout.addEventListener('click', async () => {
  try { await api('logout'); } catch (_error) { /* da igual */ }
  saveSession(null); overview = new Map();
  setStatus('Sesión cerrada.', 'ok');
  updateAccountUi(); renderCourses();
});

(async () => {
  try {
    const response = await fetch('./courses.json?v=' + Date.now(), { cache: 'no-store' });
    courses = (await response.json()).courses || [];
  } catch (_error) {
    courses = [];
  }
  renderCourses();
  updateAccountUi();
  restoreSession();
})();
