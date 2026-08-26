// WorldSpeak · reproductor genérico de cursos.
// Lee la configuración del curso de window.WORLDSPEAK_COURSE (cargado por boot.js
// desde ./course.json) y no contiene nada específico de un idioma.
const course = window.WORLDSPEAK_COURSE;
if (!course || !Array.isArray(course.tracks)) {
  throw new Error('WorldSpeak: falta window.WORLDSPEAK_COURSE (course.json)');
}
const courseId = course.id;
const audioBase = course.audioBase || './audio/';
const transcriptsBase = course.transcriptsBase || './transcripts/';
const assetVersion = course.version || '0';
const tracks = course.tracks.map((track) => ({ ...track }));
const trackCopy = Object.fromEntries(tracks.filter((track) => track.copy).map((track) => [track.id, track.copy]));
const kindLabels = course.kinds || {};

const icons = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.4v13.2L18.5 12 8 5.4Z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" fill="currentColor"/></svg>',
  waveform: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2M8 17V7M12 20V4M16 17V7M20 13v-2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M18 6.5 9 12l9 5.5v-11Z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M6 6.5l9 5.5-9 5.5v-11Z" fill="currentColor"/></svg>',
  checkFilled: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" fill="currentColor"/><path d="m7.6 12.4 2.7 2.7 6.1-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5.8 12.4 4 4 8.4-8.8" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  headphones: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13a8 8 0 0 1 16 0v4a3 3 0 0 1-3 3h-1v-7h4M4 13h4v7H7a3 3 0 0 1-3-3v-4Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h6a3 3 0 0 1 3 3V20a3 3 0 0 0-3-3H5V4.5Zm14 0h-5a3 3 0 0 0-3 3V20a3 3 0 0 1 3-3h5V4.5Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/></svg>',
  document: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.8h7.2L19 8.6v11.6H7V3.8Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="M14 4v5h5M10 13h6M10 16h6M10 10h2" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dictionary: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h9a4 4 0 0 1 4 4v11H8a3 3 0 0 0-3-3v-12Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="M8.5 8.5h5M8.5 12h6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  xCircleFilled: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" fill="currentColor"/><path d="m8.2 8.2 7.6 7.6M15.8 8.2l-7.6 7.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  stack: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="m4 12 8 4.5 8-4.5M4 16l8 4.5 8-4.5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  speed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17a8 8 0 1 1 14 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="m13 12 3-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
};

const player = document.querySelector('#player');
const lessonList = document.querySelector('#lessonList');
const playerPanel = document.querySelector('.player-panel');
const trackTitle = document.querySelector('#trackTitle');
const trackType = document.querySelector('#trackType');
const trackSubtitle = document.querySelector('#trackSubtitle');
const playPause = document.querySelector('#playPause');
const doneCount = document.querySelector('#doneCount');
const totalCount = document.querySelector('#totalCount');
const search = document.querySelector('#search');
const speed = document.querySelector('#speed');
const markDone = document.querySelector('#markDone');
const prevTrack = document.querySelector('#prevTrack');
const nextTrack = document.querySelector('#nextTrack');
const progress = document.querySelector('#progress');
const currentTime = document.querySelector('#currentTime');
const duration = document.querySelector('#duration');
const transcriptToggle = document.querySelector('#transcriptToggle');
const transcriptPanel = document.querySelector('#transcriptPanel');
const transcriptClose = document.querySelector('#transcriptClose');
const transcriptTitle = document.querySelector('#transcriptTitle');
const transcriptCount = document.querySelector('#transcriptCount');
const transcriptSummary = document.querySelector('#transcriptSummary');
const topicList = document.querySelector('#topicList');
const dialogueTagalog = document.querySelector('#dialogueTagalog');
const dialogueSpanish = document.querySelector('#dialogueSpanish');
const translationToggle = document.querySelector('#translationToggle');
const transcriptList = document.querySelector('#transcriptList');
const dictionaryOpen = document.querySelector('#dictionaryOpen');
const dictionaryModal = document.querySelector('#dictionaryModal');
const dictionaryClose = document.querySelector('#dictionaryClose');
const dictionarySearch = document.querySelector('#dictionarySearch');
const dictionaryStats = document.querySelector('#dictionaryStats');
const dictionaryList = document.querySelector('#dictionaryList');
const chips = [...document.querySelectorAll('.chip')];
const listenedTime = document.querySelector('#listenedTime');
const studyTopbar = document.querySelector('#studyTopbar');
const continueButton = document.querySelector('#continueButton');
const continueMeta = document.querySelector('#continueMeta');
const accountToggle = document.querySelector('#accountToggle');
const accountInitial = document.querySelector('#accountInitial');
const accountLabel = document.querySelector('#accountLabel');
const accountMeta = document.querySelector('#accountMeta');
const accountModal = document.querySelector('#accountModal');
const accountClose = document.querySelector('#accountClose');
const accountForm = document.querySelector('#accountForm');
const accountName = document.querySelector('#accountName');
const accountPin = document.querySelector('#accountPin');
const pinPad = document.querySelector('#pinPad');
const pinDots = [...document.querySelectorAll('#pinDots span')];
const accountStatus = document.querySelector('#accountStatus');
const accountLogged = document.querySelector('#accountLogged');
const accountNameLabel = document.querySelector('#accountNameLabel');
const accountHours = document.querySelector('#accountHours');
const accountDone = document.querySelector('#accountDone');
const accountLast = document.querySelector('#accountLast');
const accountContinue = document.querySelector('#accountContinue');
const accountLogout = document.querySelector('#accountLogout');

const progressStorageKey = `ws:${courseId}:progress`;
const accountStorageKey = 'ws:session';
const apiEndpoint = (course.api || '../api/') + 'index.php';
let progressState = loadProgressState();
let accountSession = loadAccountSession();
let accountUser = accountSession?.user || null;
let pendingSeekTime = null;
let saveTimer = null;
let lastListeningTick = null;
let suppressNextMetadataPersist = false;
const urlTrack = new URLSearchParams(location.search).get('track');
let currentId = (urlTrack && course.tracks.some((t) => t.id === urlTrack) ? urlTrack : null) || progressState.currentId || localStorage.getItem(`ws:${courseId}:current`) || tracks[0].id;
let filter = 'all';
let transcriptIndex = new Map();
let transcriptOpen = false;
let showTranslations = localStorage.getItem('ws:show-translations') !== '0';
let playerVisible = false;
let dictionaryLoaded = false;
let dictionaryEntries = [];
const transcriptCache = new Map();
const done = new Set(progressState.done?.length ? progressState.done : JSON.parse(localStorage.getItem(`ws:${courseId}:done`) || '[]'));

function srcFor(track) {
  return audioBase + encodeURIComponent(track.file);
}

function copyFor(track) {
  return trackCopy[track.id] || {
    title: track.title,
    subtitle: track.kind === 'readings' ? track.subtitle : ''
  };
}

function displayTitle(track) {
  return copyFor(track).title;
}

function displaySubtitle(track) {
  return copyFor(track).subtitle;
}

function fullTrackLabel(track) {
  return `${track.title} · ${displayTitle(track)}`;
}

function playerNumberLabel(track) {
  return track.kind === 'readings'
    ? `R${String(track.readingNumber).padStart(2, '0')}`
    : String(track.lesson).padStart(2, '0');
}

function icon(name) {
  return icons[name] || '';
}

function iconButton(button, name, label) {
  button.innerHTML = `${icon(name)}<span class="sr-only">${label}</span>`;
  button.title = label;
  button.setAttribute('aria-label', label);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeLoginName(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function sanitizePin(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 4);
}

function updatePinDots() {
  const length = sanitizePin(accountPin.value).length;
  pinDots.forEach((dot, index) => {
    dot.classList.toggle('is-filled', index < length);
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '--:--';
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const secs = String(rounded % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '';
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const secs = String(rounded % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function defaultProgressState() {
  return {
    version: 1,
    done: [],
    currentId: tracks[0]?.id || '',
    positions: {},
    lastPlayed: null,
    totalSeconds: 0,
    updatedAt: new Date().toISOString()
  };
}

function normalizeProgressState(value = {}) {
  const state = defaultProgressState();
  const incoming = value && typeof value === 'object' ? value : {};
  const positions = incoming.positions && typeof incoming.positions === 'object' ? incoming.positions : {};

  state.done = Array.isArray(incoming.done) ? incoming.done.filter(Boolean) : [];
  state.currentId = tracks.some((track) => track.id === incoming.currentId) ? incoming.currentId : state.currentId;
  state.positions = Object.fromEntries(Object.entries(positions)
    .filter(([id]) => tracks.some((track) => track.id === id))
    .map(([id, item]) => {
      const progressItem = item && typeof item === 'object' ? item : {};
      return [id, {
        currentTime: Math.max(0, Number(progressItem.currentTime) || 0),
        duration: Math.max(0, Number(progressItem.duration) || 0),
        updatedAt: progressItem.updatedAt || ''
      }];
    }));
  state.lastPlayed = incoming.lastPlayed && tracks.some((track) => track.id === incoming.lastPlayed.id)
    ? {
        id: incoming.lastPlayed.id,
        position: Math.max(0, Number(incoming.lastPlayed.position) || 0),
        duration: Math.max(0, Number(incoming.lastPlayed.duration) || 0),
        updatedAt: incoming.lastPlayed.updatedAt || ''
      }
    : null;
  state.totalSeconds = Math.max(0, Number(incoming.totalSeconds) || 0);
  state.updatedAt = incoming.updatedAt || state.updatedAt;
  return state;
}

function loadProgressState() {
  const saved = safeJsonParse(localStorage.getItem(progressStorageKey) || 'null', null);
  const state = normalizeProgressState(saved);
  const legacyDone = safeJsonParse(localStorage.getItem(`ws:${courseId}:done`) || '[]', []);
  if (!state.done.length && Array.isArray(legacyDone) && legacyDone.length) {
    state.done = legacyDone.filter(Boolean);
  }
  const legacyCurrent = localStorage.getItem(`ws:${courseId}:current`);
  if (!saved && legacyCurrent && tracks.some((track) => track.id === legacyCurrent)) {
    state.currentId = legacyCurrent;
  }
  return state;
}

function loadAccountSession() {
  const saved = safeJsonParse(localStorage.getItem(accountStorageKey) || 'null', null);
  return saved && saved.token && saved.user ? saved : null;
}

function saveAccountSession(session) {
  accountSession = session;
  accountUser = session?.user || null;
  if (session) {
    localStorage.setItem(accountStorageKey, JSON.stringify(session));
  } else {
    localStorage.removeItem(accountStorageKey);
  }
}

function formatStudyTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  if (total < 3600) {
    return `${Math.max(0, Math.round(total / 60))} min`;
  }
  const hours = total / 3600;
  return `${hours >= 10 ? hours.toFixed(1) : hours.toFixed(2)} h`;
}

function trackById(id) {
  return tracks.find((track) => track.id === id) || tracks[0];
}

function describeProgressPoint(point) {
  if (!point?.id) {
    return 'Sin empezar';
  }
  const track = trackById(point.id);
  return `${playerNumberLabel(track)} · ${formatClock(Number(point.position) || 0)}`;
}

function latestPoint(progress) {
  if (progress.lastPlayed?.id) {
    return progress.lastPlayed;
  }

  const latest = Object.entries(progress.positions || {})
    .map(([id, item]) => ({ id, ...item, position: item.currentTime }))
    .sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0))[0];
  return latest || null;
}

function saveProgressLocal() {
  progressState.done = [...done];
  progressState.currentId = currentId;
  progressState.updatedAt = new Date().toISOString();
  localStorage.setItem(progressStorageKey, JSON.stringify(progressState));
  localStorage.setItem(`ws:${courseId}:current`, currentId);
  localStorage.setItem(`ws:${courseId}:done`, JSON.stringify([...done]));
}

function accountHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (accountSession?.token) {
    headers.Authorization = `Bearer ${accountSession.token}`;
  }
  return headers;
}

async function accountRequest(action, payload = {}) {
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: accountHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({ action, course: courseId, ...payload })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'No se ha podido sincronizar.');
  }
  return data;
}

function scheduleServerSave() {
  if (!accountSession?.token) {
    return;
  }
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    accountRequest('save', { progress: progressState }).catch(() => {});
  }, 1800);
}

function mergeProgress(local, remote) {
  const a = normalizeProgressState(local);
  const b = normalizeProgressState(remote);
  const merged = normalizeProgressState(a);
  merged.done = [...new Set([...a.done, ...b.done])];
  merged.totalSeconds = Math.max(a.totalSeconds, b.totalSeconds);

  const ids = new Set([...Object.keys(a.positions || {}), ...Object.keys(b.positions || {})]);
  ids.forEach((id) => {
    const left = a.positions[id];
    const right = b.positions[id];
    if (!left) {
      merged.positions[id] = right;
      return;
    }
    if (!right) {
      merged.positions[id] = left;
      return;
    }
    const leftTime = Date.parse(left.updatedAt || 0);
    const rightTime = Date.parse(right.updatedAt || 0);
    merged.positions[id] = rightTime > leftTime ? right : left;
  });

  const leftLast = latestPoint(a);
  const rightLast = latestPoint(b);
  const leftTime = Date.parse(leftLast?.updatedAt || 0);
  const rightTime = Date.parse(rightLast?.updatedAt || 0);
  merged.lastPlayed = rightTime > leftTime ? rightLast : leftLast;
  merged.currentId = merged.lastPlayed?.id || a.currentId || b.currentId || tracks[0].id;
  return merged;
}

function applyProgressState(nextState) {
  progressState = normalizeProgressState(nextState);
  done.clear();
  progressState.done.forEach((id) => done.add(id));
  currentId = progressState.currentId || currentId;
  saveProgressLocal();
  if (!playerVisible) {
    const point = latestPoint(progressState);
    selectTrack(currentId, false, {
      showPlayer: false,
      openTranscript: false,
      rememberSelection: false,
      persistPrevious: false,
      position: Number(point?.position) || null
    });
  }
  updateStats();
  updateAccountUi();
  updateContinueUi();
  renderList();
}

function currentTrackPosition(track) {
  const position = progressState.positions?.[track.id];
  const current = Number(position?.currentTime) || 0;
  const knownDuration = Number(position?.duration) || 0;
  if (current < 3) {
    return 0;
  }
  if (knownDuration > 0 && current > knownDuration - 8) {
    return 0;
  }
  return current;
}

function seekWhenReady(seconds) {
  pendingSeekTime = Number(seconds) || 0;
  applyPendingSeek();
}

function applyPendingSeek() {
  if (!pendingSeekTime || !Number.isFinite(player.duration) || player.duration <= 0) {
    return;
  }
  player.currentTime = Math.min(Math.max(0, pendingSeekTime), Math.max(0, player.duration - 1));
  pendingSeekTime = null;
  updateProgress();
}

function persistPlaybackProgress(options = {}) {
  const { sync = true } = options;
  const track = trackById(currentId);
  const time = Math.max(0, Number(player.currentTime) || 0);
  const trackDuration = Number.isFinite(player.duration) && player.duration > 0
    ? player.duration
    : Number(progressState.positions?.[track.id]?.duration) || 0;
  const stamp = new Date().toISOString();

  progressState.currentId = track.id;
  progressState.done = [...done];
  progressState.positions[track.id] = {
    currentTime: time,
    duration: trackDuration,
    updatedAt: stamp
  };
  progressState.lastPlayed = {
    id: track.id,
    position: time,
    duration: trackDuration,
    updatedAt: stamp
  };

  saveProgressLocal();
  updateAccountUi();
  updateContinueUi();
  if (sync) {
    scheduleServerSave();
  }
}

function recordListeningTime() {
  if (player.paused || player.ended) {
    lastListeningTick = null;
    return;
  }

  const now = Date.now();
  if (lastListeningTick) {
    const delta = Math.min(5, Math.max(0, (now - lastListeningTick) / 1000));
    if (delta > 0.1) {
      progressState.totalSeconds += delta;
    }
  }
  lastListeningTick = now;
  persistPlaybackProgress({ sync: true });
}

function updateContinueUi() {
  const point = latestPoint(progressState);
  const hasPoint = Boolean(point?.id);
  continueButton.hidden = !hasPoint;
  studyTopbar.classList.toggle('has-continue', hasPoint);
  accountContinue.disabled = !hasPoint;
  if (!hasPoint) {
    continueMeta.textContent = 'Donde ibas';
    accountLast.textContent = 'Sin empezar';
    return;
  }
  const track = trackById(point.id);
  const meta = `${playerNumberLabel(track)} · ${displayTitle(track)} · ${formatClock(Number(point.position) || 0)}`;
  continueMeta.textContent = meta;
  accountLast.textContent = meta;
}

function updateAccountUi() {
  const hoursText = formatStudyTime(progressState.totalSeconds);
  listenedTime.textContent = hoursText;
  accountHours.textContent = hoursText;
  accountDone.textContent = String(done.size);
  accountLogged.hidden = !accountUser;
  accountForm.hidden = Boolean(accountUser);
  accountLogout.hidden = !accountUser;
  accountNameLabel.textContent = accountUser?.name || '';
  accountLabel.textContent = accountUser ? accountUser.name : 'Entrar';
  accountMeta.textContent = accountUser ? 'Progreso sincronizado' : 'Guardar progreso';
  accountInitial.textContent = accountUser?.name?.trim()?.[0]?.toUpperCase() || '?';
}

function setAccountStatus(message = '', type = '') {
  accountStatus.textContent = message;
  accountStatus.classList.toggle('is-error', type === 'error');
  accountStatus.classList.toggle('is-ok', type === 'ok');
}

function openAccountModal() {
  accountModal.hidden = false;
  accountToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('modal-open');
  updateAccountUi();
  updateContinueUi();
  requestAnimationFrame(() => {
    if (!accountUser) {
      accountName.focus({ preventScroll: true });
    }
  });
}

function closeAccountModal() {
  accountModal.hidden = true;
  accountToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('modal-open');
  accountToggle.focus({ preventScroll: true });
}

function continueFromLastPoint() {
  const point = latestPoint(progressState);
  if (!point?.id) {
    return;
  }
  const track = trackById(point.id);
  transcriptOpen = false;
  selectTrack(track.id, false, {
    showPlayer: true,
    openTranscript: false,
    position: Number(point.position) || 0
  });
  player.play().catch(() => {});
}

async function restoreAccountSession() {
  if (!accountSession?.token) {
    updateAccountUi();
    updateContinueUi();
    return;
  }

  try {
    const data = await accountRequest('me');
    saveAccountSession({ token: accountSession.token, user: data.user });
    applyProgressState(mergeProgress(progressState, data.progress || {}));
    await accountRequest('save', { progress: progressState });
    setAccountStatus('Progreso sincronizado.', 'ok');
  } catch (_error) {
    saveAccountSession(null);
    setAccountStatus('', '');
    updateAccountUi();
    updateContinueUi();
  }
}

function currentIndex() {
  return Math.max(0, tracks.findIndex((track) => track.id === currentId));
}

function updateTranscriptFocus() {
  const hasActiveSegment = Boolean(transcriptList.querySelector('.transcript-segment.is-active'));
  const isPlaying = !player.paused && !player.ended;
  const focusEnabled = !transcriptPanel.hidden && isPlaying && hasActiveSegment;
  transcriptPanel.classList.toggle('is-focus-mode', focusEnabled);
  document.body.classList.toggle('transcript-focus-mode', focusEnabled);
}

function updateCurrentSegment() {
  if (transcriptPanel.hidden) {
    transcriptPanel.classList.remove('has-active-segment');
    updateTranscriptFocus();
    return;
  }

  const now = player.currentTime;
  const segments = [...transcriptList.querySelectorAll('.transcript-segment[data-start]')];
  let active = null;
  segments.forEach((segment, index) => {
    const start = Number(segment.dataset.start);
    const rawEnd = Number(segment.dataset.end);
    const nextStart = Number(segments[index + 1]?.dataset.start);
    const durationEnd = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : NaN;
    let end = Number.isFinite(rawEnd) ? rawEnd : NaN;
    if (Number.isFinite(nextStart)) {
      end = Number.isFinite(end) ? Math.max(end, nextStart) : nextStart;
    } else if (!Number.isFinite(end)) {
      end = Number.isFinite(durationEnd) ? durationEnd : start + 4;
    }
    const isActive = Number.isFinite(start) && Number.isFinite(end) && now >= start && now < end;
    segment.classList.toggle('is-active', isActive);
    if (isActive) {
      active = segment;
    }
  });
  transcriptPanel.classList.toggle('has-active-segment', Boolean(active));
  updateTranscriptFocus();

  if (active && !transcriptList.matches(':hover')) {
    active.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

function saveDone() {
  localStorage.setItem(`ws:${courseId}:done`, JSON.stringify([...done]));
  saveProgressLocal();
  updateStats();
  updateAccountUi();
  scheduleServerSave();
}

function updateStats() {
  doneCount.textContent = done.size;
  totalCount.textContent = tracks.length;
  listenedTime.textContent = formatStudyTime(progressState.totalSeconds);
  updateContinueUi();
}

function updatePlayButton() {
  const isPlaying = !player.paused && !player.ended;
  playPause.innerHTML = `${icon(isPlaying ? 'pause' : 'play')}<span class="sr-only">${isPlaying ? 'Pausar' : 'Reproducir'}</span>`;
  playPause.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
  playPause.title = isPlaying ? 'Pausar' : 'Reproducir';
  playPause.classList.toggle('is-playing', isPlaying);
}

function setPlayerVisible(visible) {
  playerVisible = visible;
  playerPanel.classList.toggle('is-hidden', !visible);
  document.body.classList.toggle('player-visible', visible);
  updatePlayerMetrics();
  requestAnimationFrame(updatePlayerMetrics);
}

function updatePlayerMetrics() {
  const fallback = window.matchMedia('(max-width: 760px)').matches ? 165 : 150;
  if (!playerVisible || playerPanel.classList.contains('is-hidden')) {
    document.documentElement.style.setProperty('--player-stack-offset', `${fallback}px`);
    return;
  }

  const rect = playerPanel.getBoundingClientRect();
  const stackOffset = Math.max(window.innerHeight - rect.top + 12, fallback);
  document.documentElement.style.setProperty('--player-stack-offset', `${Math.round(stackOffset)}px`);
}

function setTranscriptVisible(visible) {
  document.body.classList.toggle('transcript-visible', visible);
  document.body.classList.toggle('ws-transcript-open', visible);
  if (visible) {
    updatePlayerMetrics();
  }
}

function updateProgress() {
  currentTime.textContent = formatTime(player.currentTime);
  duration.textContent = formatTime(player.duration);

  if (Number.isFinite(player.duration) && player.duration > 0) {
    const progressValue = Math.round((player.currentTime / player.duration) * 1000);
    progress.value = String(progressValue);
    progress.style.setProperty('--progress', `${progressValue / 10}%`);
  } else {
    progress.value = '0';
    progress.style.setProperty('--progress', '0%');
  }
  updateCurrentSegment();
}

function resetProgressDisplay() {
  currentTime.textContent = '0:00';
  duration.textContent = '--:--';
  progress.value = '0';
  progress.style.setProperty('--progress', '0%');
}

function setMediaSessionHandler(action, handler) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch (_error) {
    // Some mobile browsers expose Media Session but not every action.
  }
}

function renderMiniCard(track) {
  const card = document.querySelector('#miniCard');
  if (!card) return;
  const entry = transcriptIndex.get(track.id) || {};
  const topics = (entry.topics || []).slice(0, 6).map((t) => `<span>${t}</span>`).join('');
  card.innerHTML = `<span class="lesson-pill">${track.title}</span><h2>${displayTitle(track)}</h2><p>${entry.summary || displaySubtitle(track) || ''}</p><div class="mini-topics">${topics}</div><button type="button" class="mini-read" id="miniRead">📖 Leer el texto mientras escuchas</button>`;
  card.querySelector('#miniRead').addEventListener('click', () => { transcriptOpen = true; renderTranscript(track); });
}

function safePlay() {
  const resumeAt = player.currentTime;
  return player.play().catch(() => {
    // iOS suspende el elemento tras bloquear la pantalla: recargar y volver al mismo segundo
    const src = player.currentSrc || player.src;
    const once = () => { player.removeEventListener('loadedmetadata', once); try { player.currentTime = resumeAt; } catch (_e) {} player.play().catch(() => {}); };
    player.addEventListener('loadedmetadata', once);
    player.src = src;
    player.load();
  });
}

function updateMediaSession(track) {
  if (!('mediaSession' in navigator)) {
    return;
  }

  try {
    if ('MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: course.title || 'WorldSpeak',
        album: track.kind === 'main' ? 'Audio principal' : 'Lecturas'
      });
    }
  } catch (_error) {
    // Metadata is progressive enhancement for lock-screen controls.
  }

  setMediaSessionHandler('play', () => safePlay());
  setMediaSessionHandler('pause', () => player.pause());
  setMediaSessionHandler('previoustrack', () => playPrevious());
  setMediaSessionHandler('nexttrack', () => playNext());
}

function languageLabel(language) {
  return {
    tl: course.language?.name || 'Idioma',
    en: course.narratorLabel || 'Inglés',
    en: 'Inglés',
    mixed: 'Mixto',
    other: 'Otro'
  }[language] || 'Otro';
}

function kindLabel(kind) {
  return {
    instruction: 'Guía',
    prompt: 'Repite',
    phrase: 'Frase',
    dialogue: 'Diálogo',
    explanation: 'Explicación',
    other: 'Otro'
  }[kind] || 'Bloque';
}

function hideTranscript() {
  transcriptToggle.hidden = true;
  transcriptPanel.hidden = true;
  setTranscriptVisible(false);
  transcriptPanel.classList.remove('has-active-segment', 'is-focus-mode');
  document.body.classList.remove('transcript-focus-mode');
  transcriptTitle.textContent = '';
  transcriptCount.textContent = '';
  transcriptCount.hidden = true;
  transcriptSummary.textContent = '';
  transcriptSummary.hidden = true;
  topicList.innerHTML = '';
  dialogueTagalog.innerHTML = '';
  dialogueSpanish.innerHTML = '';
  transcriptList.innerHTML = '';
}

function updateTranscriptToggle(hasTranscript) {
  transcriptToggle.hidden = !hasTranscript || transcriptOpen;
  if (!hasTranscript) {
    return;
  }

  transcriptToggle.classList.remove('is-open');
  transcriptToggle.setAttribute('aria-expanded', transcriptOpen ? 'true' : 'false');
  const iconSlot = transcriptToggle.querySelector('.transcript-toggle-icon');
  if (iconSlot) {
    iconSlot.innerHTML = icon('document');
  }
  transcriptToggle.querySelector('strong').textContent = 'Leer texto';
  updatePlayerMetrics();
  requestAnimationFrame(updatePlayerMetrics);
}

function setTranslationState() {
  transcriptPanel.classList.toggle('hide-translations', !showTranslations);
  translationToggle.textContent = showTranslations ? 'Ocultar español' : 'Mostrar español';
  translationToggle.setAttribute('aria-pressed', showTranslations ? 'true' : 'false');
}

function usefulSummary(summary) {
  const text = (summary || '').trim();
  if (!text) {
    return '';
  }

  if (normalizeText(text).startsWith('transcripcion sincronizada por bloques')) {
    return '';
  }

  return text;
}

function renderTopics(topics = []) {
  topicList.innerHTML = '';
  topics.forEach((topic) => {
    const pill = document.createElement('span');
    pill.className = 'topic-pill';
    pill.textContent = topic;
    topicList.append(pill);
  });
}

function renderDialogue(list, items = []) {
  list.innerHTML = '';
  items.forEach((item) => {
    const row = document.createElement('li');
    row.textContent = item;
    list.append(row);
  });
}

function comparableText(value) {
  return normalizeText(value || '').replace(/[^a-z0-9]/g, '');
}

function shouldShowTranslation(segment) {
  const translation = (segment.translation_es || '').trim();
  if (!translation || segment.isGuideRun) {
    return false;
  }

  const source = (segment.text || '').trim();
  const sourceComparable = comparableText(source);
  const translationComparable = comparableText(translation);
  return Boolean(translationComparable) && sourceComparable !== translationComparable;
}

function guideText(parts) {
  return parts
    .map((part) => (part.text || '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function groupTranscriptSegments(segments = []) {
  const grouped = [];
  let guideRun = [];

  const flushGuideRun = () => {
    if (!guideRun.length) {
      return;
    }

    const first = guideRun[0];
    const last = guideRun[guideRun.length - 1];
    grouped.push({
      start: first.start,
      end: last.end,
      language: 'en',
      kind: 'instruction',
      text: guideText(guideRun),
      translation_es: '',
      isGuideRun: true
    });
    guideRun = [];
  };

  segments.forEach((segment) => {
    if (segment.language === 'en') {
      guideRun.push(segment);
      return;
    }

    flushGuideRun();
    grouped.push(segment);
  });

  flushGuideRun();
  return grouped;
}

function segmentTimeLabel(segment) {
  const start = Number(segment.start);
  const end = Number(segment.end);
  if (!Number.isFinite(start)) {
    return '';
  }

  if (segment.isGuideRun && Number.isFinite(end)) {
    return `${formatClock(start)} - ${formatClock(end)}`;
  }

  return formatClock(start);
}

function createSegment(segment) {
  const item = document.createElement('article');
  item.className = `transcript-segment${segment.isGuideRun ? ' is-guide-run' : ''}`;
  item.dataset.language = segment.language || 'other';
  if (Number.isFinite(Number(segment.start))) {
    item.dataset.start = String(segment.start);
    if (Number.isFinite(Number(segment.end))) {
      item.dataset.end = String(segment.end);
    }
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Ir a ${formatClock(Number(segment.start))}`);
    item.addEventListener('click', () => {
      player.currentTime = Number(segment.start);
      player.play().catch(() => {});
    });
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        player.currentTime = Number(segment.start);
        player.play().catch(() => {});
      }
    });
  }

  const meta = document.createElement('div');
  meta.className = 'segment-meta';

  if (Number.isFinite(Number(segment.start))) {
    const time = document.createElement('span');
    time.className = 'segment-time';
    time.textContent = segmentTimeLabel(segment);
    meta.append(time);
  }

  const text = document.createElement('p');
  text.className = 'segment-text';
  text.textContent = segment.text || '';

  if (meta.children.length) {
    item.append(meta);
  }
  item.append(text);

  if (shouldShowTranslation(segment)) {
    const details = document.createElement('div');
    details.className = 'segment-details';
    const translation = document.createElement('p');
    translation.textContent = segment.translation_es;
    details.append(translation);
    item.append(details);
  }

  return item;
}

async function renderTranscript(track) {
  const entry = transcriptIndex.get(track.id);
  if (!entry || !entry.enriched) {
    hideTranscript();
    return;
  }

  updateTranscriptToggle(true);
  if (!transcriptOpen) {
    transcriptPanel.hidden = true;
    setTranscriptVisible(false);
    transcriptPanel.classList.remove('has-active-segment', 'is-focus-mode');
    document.body.classList.remove('transcript-focus-mode');
    return;
  }

  transcriptPanel.hidden = false;
  setTranscriptVisible(true);
  transcriptPanel.scrollTop = 0;
  transcriptTitle.textContent = track.title;
  transcriptCount.textContent = '';
  transcriptCount.hidden = true;
  transcriptSummary.textContent = '';
  transcriptSummary.hidden = true;
  topicList.innerHTML = '';
  dialogueTagalog.innerHTML = '';
  dialogueSpanish.innerHTML = '';
  transcriptList.innerHTML = '';
  setTranslationState();

  try {
    if (!transcriptCache.has(track.id)) {
      const response = await fetch(`${transcriptsBase}${String(entry.enriched).replace(/^transcripts\//, '')}?v=${assetVersion}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Transcript HTTP ${response.status}`);
      }
      transcriptCache.set(track.id, await response.json());
    }

    if (currentId !== track.id) {
      return;
    }

    const data = transcriptCache.get(track.id);
    const segments = groupTranscriptSegments(data.segments || []);
    const summary = usefulSummary(data.summary_es);
    if (document.body.classList.contains('player-only')) {
      transcriptTitle.innerHTML = `<span class="lesson-pill">${track.title}</span><span class="lesson-name">${displayTitle(track)}</span>`;
    } else {
      transcriptTitle.textContent = fullTrackLabel(track);
    }
    transcriptSummary.textContent = summary;
    transcriptSummary.hidden = !summary;
    renderTopics(data.topics || []);
    renderDialogue(dialogueTagalog, data.dialogue?.tl || []);
    renderDialogue(dialogueSpanish, data.dialogue?.es || []);

    const fragment = document.createDocumentFragment();
    segments.forEach((segment) => fragment.append(createSegment(segment)));
    transcriptList.append(fragment);
    updateCurrentSegment();
  } catch (_error) {
    transcriptCount.textContent = '';
    transcriptCount.hidden = true;
    transcriptSummary.textContent = 'No se ha podido cargar la transcripción.';
    transcriptSummary.hidden = false;
  }
}

async function loadTranscriptIndex() {
  try {
    const response = await fetch(`${transcriptsBase}index.json?v=${assetVersion}`, { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    transcriptIndex = new Map((data.tracks || []).map((entry) => [entry.id, entry]));
    renderList();
    renderTranscript(tracks[currentIndex()]);
  } catch (_error) {
    hideTranscript();
  }
}

function dictionaryTypeLabel(type) {
  return {
    word: 'Palabra',
    phrase: 'Frase',
    sentence: 'Frase larga'
  }[type] || 'Entrada';
}

function dictionaryTypeOrder(type) {
  return {
    word: 0,
    phrase: 1,
    sentence: 2
  }[type] ?? 9;
}

function dictionarySectionTitle(type) {
  return {
    word: 'Palabras',
    phrase: 'Frases clave',
    sentence: 'Frases largas'
  }[type] || 'Otras entradas';
}

function dictionaryFirstRef(entry) {
  return (entry.refs || []).find((ref) => Number.isFinite(Number(ref.start)));
}

function createDictionaryCard(entry) {
  const card = document.createElement('article');
  card.className = `dictionary-card dictionary-${entry.type || 'entry'}`;

  const tagalog = document.createElement('h3');
  tagalog.textContent = entry.term || entry.tagalog || '';

  const spanish = document.createElement('p');
  spanish.textContent = entry.translation || entry.spanish || '';

  const meta = document.createElement('div');
  meta.className = 'dictionary-meta';

  const type = document.createElement('span');
  type.textContent = dictionaryTypeLabel(entry.type);
  meta.append(type);

  if (entry.topic) {
    const topic = document.createElement('span');
    topic.textContent = entry.topic;
    meta.append(topic);
  }

  if (entry.sources?.length) {
    const source = document.createElement('span');
    const ref = dictionaryFirstRef(entry);
    const refTime = ref ? ` · ${formatClock(Number(ref.start))}` : '';
    source.textContent = `${entry.sources.slice(0, 2).join(' · ')}${refTime}`;
    meta.append(source);
  }

  card.append(tagalog, spanish, meta);
  return card;
}

function createDictionarySection(type, entries) {
  const section = document.createElement('section');
  section.className = `dictionary-section dictionary-section-${type || 'entry'}`;

  const header = document.createElement('div');
  header.className = 'dictionary-section-header';
  const title = document.createElement('h3');
  title.textContent = dictionarySectionTitle(type);
  const count = document.createElement('span');
  count.textContent = `${entries.length}`;
  header.append(title, count);

  const grid = document.createElement('div');
  grid.className = 'dictionary-section-grid';
  entries.forEach((entry) => grid.append(createDictionaryCard(entry)));

  section.append(header, grid);
  return section;
}

function renderDictionary() {
  const q = normalizeText(dictionarySearch.value.trim());
  const matches = dictionaryEntries.filter((entry) => {
    const haystack = normalizeText(
      `${entry.term || entry.tagalog || ''} ${entry.translation || entry.spanish || ''} ${entry.topic || ''} ${(entry.sources || []).join(' ')} ${dictionaryTypeLabel(entry.type)}`
    );
    return !q || haystack.includes(q);
  });

  dictionaryList.innerHTML = '';
  dictionaryStats.textContent = `${matches.length} entradas`;

  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'dictionary-empty';
    empty.textContent = 'No hay entradas con esa búsqueda.';
    dictionaryList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  const limited = matches.slice(0, 360);
  const groups = new Map();
  limited.forEach((entry) => {
    const type = entry.type || 'entry';
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type).push(entry);
  });

  [...groups.entries()]
    .sort(([typeA], [typeB]) => dictionaryTypeOrder(typeA) - dictionaryTypeOrder(typeB))
    .forEach(([type, entries]) => fragment.append(createDictionarySection(type, entries)));

  dictionaryList.append(fragment);
}

async function loadDictionary() {
  if (dictionaryLoaded) {
    return;
  }

  dictionaryList.innerHTML = '<p class="dictionary-empty">Cargando diccionario...</p>';
  dictionaryStats.textContent = '';

  try {
    const response = await fetch(`${transcriptsBase}dictionary.json?v=${assetVersion}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Dictionary HTTP ${response.status}`);
    }
    const data = await response.json();
    dictionaryEntries = data.entries || [];
    dictionaryLoaded = true;
    renderDictionary();
  } catch (_error) {
    dictionaryList.innerHTML = '<p class="dictionary-empty">Todavía no se ha podido cargar el diccionario.</p>';
  }
}

function openDictionary() {
  dictionaryModal.hidden = false;
  document.body.classList.add('modal-open');
  loadDictionary();
  requestAnimationFrame(() => dictionarySearch.focus({ preventScroll: true }));
}

function closeDictionary() {
  dictionaryModal.hidden = true;
  document.body.classList.remove('modal-open');
  dictionaryOpen.focus({ preventScroll: true });
}

function selectTrack(id, autoplay = true, options = {}) {
  const {
    showPlayer = true,
    openTranscript = true,
    position = null,
    rememberSelection = true,
    persistPrevious = true
  } = options;
  if (persistPrevious && player.currentSrc) {
    persistPlaybackProgress({ sync: true });
  }
  const track = tracks.find((item) => item.id === id) || tracks[0];
  currentId = track.id;
  localStorage.setItem(`ws:${courseId}:current`, currentId);
  if (showPlayer) {
    setPlayerVisible(true);
  }
  if (openTranscript) {
    transcriptOpen = true;
  }
  trackTitle.textContent = displayTitle(track);
  trackSubtitle.textContent = displaySubtitle(track);
  trackType.textContent = playerNumberLabel(track);
  trackType.setAttribute('aria-label', track.kind === 'readings'
    ? `Lectura ${String(track.readingNumber).padStart(2, '0')}`
    : `Lección ${String(track.lesson).padStart(2, '0')}`);
  trackType.dataset.kind = track.kind;
  playerPanel.dataset.kind = track.kind;
  const nextSrc = new URL(srcFor(track), window.location.href).href;
  const resumeAt = Number.isFinite(Number(position)) ? Number(position) : currentTrackPosition(track);
  if (player.currentSrc !== nextSrc && player.src !== nextSrc) {
    resetProgressDisplay();
    suppressNextMetadataPersist = !rememberSelection;
    player.src = srcFor(track);
    seekWhenReady(resumeAt);
  } else if (resumeAt > 0 && Math.abs(player.currentTime - resumeAt) > 2) {
    seekWhenReady(resumeAt);
  }
  player.playbackRate = Number(speed.value);
  iconButton(markDone, 'check', done.has(track.id) ? 'Desmarcar' : 'Marcar');
  markDone.classList.toggle('is-done', done.has(track.id));
  updateMediaSession(track);
  updatePlayButton();
  updateProgress();
  renderList();
  renderTranscript(track);
  updatePlayerMetrics();
  requestAnimationFrame(updatePlayerMetrics);

  if (autoplay) {
    player.play().catch(() => {});
  }
  if (!rememberSelection) {
    progressState.currentId = track.id;
    saveProgressLocal();
    updateAccountUi();
    updateContinueUi();
  } else if (resumeAt > 0) {
    const stamp = new Date().toISOString();
    progressState.currentId = track.id;
    progressState.positions[track.id] = {
      ...(progressState.positions[track.id] || {}),
      currentTime: resumeAt,
      updatedAt: stamp
    };
    progressState.lastPlayed = {
      id: track.id,
      position: resumeAt,
      duration: Number(progressState.positions[track.id]?.duration) || 0,
      updatedAt: stamp
    };
    saveProgressLocal();
    updateAccountUi();
    updateContinueUi();
  } else {
    persistPlaybackProgress({ sync: false });
  }
}

function visibleTracks() {
  const q = normalizeText(search.value.trim());
  return tracks.filter((track) => {
    const entry = transcriptIndex.get(track.id);
    const typeLabel = track.kind === 'main' ? 'audio principal leccion' : 'lectura pronunciacion';
    const topics = (entry?.topics || []).join(' ');
    const summary = entry?.summary || '';
    const haystack = normalizeText(
      `${track.title} ${track.subtitle || ''} ${typeLabel} ${track.lesson} ${track.readingNumber || ''} ${topics} ${summary}`
    );
    const matchesSearch = !q || haystack.includes(q);
    const matchesFilter =
      filter === 'all' ||
      track.kind === filter ||
      (filter === 'pending' && !done.has(track.id));
    return matchesSearch && matchesFilter;
  });
}

function renderList() {
  const items = visibleTracks();
  lessonList.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No hay audios con ese filtro.';
    lessonList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  const groups = [
    {
      kind: 'main',
      title: 'Lecciones',
      description: '',
      items: items.filter((track) => track.kind === 'main')
    },
    {
      kind: 'readings',
      title: 'Lecturas',
      description: 'Lecturas del libro: empiezan después de la lección 10.',
      items: items.filter((track) => track.kind === 'readings')
    }
  ].filter((group) => group.items.length);

  groups.forEach((group) => {
    const section = document.createElement('section');
    section.className = `lesson-section ${group.kind}-section`;

    const header = document.createElement('div');
    header.className = 'section-header';

    const headingWrap = document.createElement('div');
    headingWrap.className = 'section-title';
    const titleIcon = document.createElement('span');
    titleIcon.className = 'section-icon';
    titleIcon.innerHTML = icon(group.kind === 'main' ? 'headphones' : 'book');
    const heading = document.createElement('h2');
    heading.textContent = group.title;
    const titleText = document.createElement('div');
    titleText.append(heading);
    if (group.description) {
      const description = document.createElement('p');
      description.textContent = group.description;
      titleText.append(description);
    }
    headingWrap.append(titleIcon, titleText);

    const badge = document.createElement('span');
    badge.className = 'section-badge';
    badge.setAttribute('aria-label', `${group.items.length} audios`);
    badge.innerHTML = `${icon('stack')}<strong>${group.items.length}</strong>`;

    header.append(headingWrap, badge);
    section.append(header);

    const grid = document.createElement('div');
    grid.className = 'section-grid';

    group.items.forEach((track) => {
      grid.append(createTrackCard(track));
    });

    section.append(grid);
    fragment.append(section);
  });

  lessonList.append(fragment);
}

function createTrackCard(track) {
    const card = document.createElement('article');
    const isCurrent = track.id === currentId;
    const isDone = done.has(track.id);
    card.className = `lesson-card ${track.kind}-track${isDone ? ' done' : ''}${isCurrent && !isDone ? ' current' : ''}`;
    const entry = transcriptIndex.get(track.id);

    const number = document.createElement('span');
    number.className = 'lesson-number';
    number.textContent = track.kind === 'readings'
      ? `R${String(track.readingNumber).padStart(2, '0')}`
      : String(track.lesson).padStart(2, '0');

    const text = document.createElement('div');
    text.className = 'lesson-copy';

    const title = document.createElement('h3');
    title.textContent = displayTitle(track);

    const meta = document.createElement('p');
    meta.textContent = displaySubtitle(track);
    text.append(title, meta);

    if (isCurrent && !isDone) {
      const currentBadge = document.createElement('span');
      currentBadge.className = 'current-badge';
      currentBadge.textContent = 'Vas por aquí';
      text.append(currentBadge);
    }

    const topics = (entry?.topics || []).slice(0, 4);
    if (topics.length) {
      const topicWrap = document.createElement('div');
      topicWrap.className = 'lesson-topics';
      topics.forEach((topic) => {
        const pill = document.createElement('span');
        pill.textContent = topic;
        topicWrap.append(pill);
      });
      text.append(topicWrap);
    }

    const status = document.createElement('span');
    status.className = `status-icon${isDone ? ' is-done' : ''}${isCurrent && !isDone ? ' is-current' : ''}`;
    status.innerHTML = icon('check');
    status.title = isDone ? 'Completada' : (isCurrent ? 'Vas por aquí' : 'Pendiente');
    status.setAttribute('aria-label', isDone ? 'Completada' : (isCurrent ? 'Vas por aquí' : 'Pendiente'));

    const button = document.createElement('button');
    const isCurrentPlaying = isCurrent && !player.paused && !player.ended;
    const buttonLabel = isCurrentPlaying ? `Pausar ${fullTrackLabel(track)}` : `Reproducir ${fullTrackLabel(track)}`;
    button.className = `play-button${isCurrent ? ' is-current' : ''}`;
    button.type = 'button';
    button.innerHTML = `${icon(isCurrentPlaying ? 'pause' : 'play')}<span class="sr-only">${buttonLabel}</span>`;
    button.title = buttonLabel;
    button.setAttribute('aria-label', buttonLabel);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (isCurrentPlaying) {
        player.pause();
        return;
      }
      selectTrack(track.id);
    });

    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Reproducir ${fullTrackLabel(track)}`);
    card.addEventListener('click', () => selectTrack(track.id));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectTrack(track.id);
      }
    });

    card.append(number, text, status, button);
    return card;
}

markDone.addEventListener('click', () => {
  if (done.has(currentId)) {
    done.delete(currentId);
  } else {
    done.add(currentId);
  }
  saveDone();
  iconButton(markDone, 'check', done.has(currentId) ? 'Desmarcar' : 'Marcar');
  markDone.classList.toggle('is-done', done.has(currentId));
  renderList();
});

function syncCurrentDoneUi() {
  iconButton(markDone, 'check', done.has(currentId) ? 'Desmarcar' : 'Marcar');
  markDone.classList.toggle('is-done', done.has(currentId));
  updateStats();
  renderList();
}

function playPrevious() {
  const idx = currentIndex();
  selectTrack(tracks[Math.max(0, idx - 1)].id);
}

function playNext() {
  const idx = currentIndex();
  selectTrack(tracks[Math.min(tracks.length - 1, idx + 1)].id);
}

prevTrack.addEventListener('click', playPrevious);

nextTrack.addEventListener('click', playNext);

playPause.addEventListener('click', () => {
  setPlayerVisible(true);
  if (player.paused || player.ended) {
    safePlay();
  } else {
    player.pause();
  }
});

player.addEventListener('ended', () => {
  recordListeningTime();
  done.add(currentId);
  saveDone();
  persistPlaybackProgress({ sync: true });
  syncCurrentDoneUi();
  updateTranscriptFocus();
  const idx = currentIndex();
  if (idx < tracks.length - 1) {
    selectTrack(tracks[idx + 1].id);
  } else {
    renderList();
  }
});

player.addEventListener('play', () => {
  lastListeningTick = Date.now();
  setPlayerVisible(true);
  updatePlayButton();
  updateTranscriptFocus();
  persistPlaybackProgress({ sync: true });
  renderList();
});

player.addEventListener('pause', () => {
  recordListeningTime();
  updatePlayButton();
  updateTranscriptFocus();
  persistPlaybackProgress({ sync: true });
  renderList();
});

player.addEventListener('loadedmetadata', () => {
  applyPendingSeek();
  updateProgress();
  if (suppressNextMetadataPersist) {
    suppressNextMetadataPersist = false;
    saveProgressLocal();
    updateAccountUi();
    updateContinueUi();
    return;
  }
  persistPlaybackProgress({ sync: false });
});
player.addEventListener('timeupdate', () => {
  updateProgress();
  recordListeningTime();
});
window.addEventListener('resize', updatePlayerMetrics);

progress.addEventListener('input', () => {
  if (Number.isFinite(player.duration) && player.duration > 0) {
    player.currentTime = (Number(progress.value) / 1000) * player.duration;
  }
  lastListeningTick = player.paused ? null : Date.now();
  progress.style.setProperty('--progress', `${Number(progress.value) / 10}%`);
  persistPlaybackProgress({ sync: true });
});

speed.addEventListener('change', () => {
  player.playbackRate = Number(speed.value);
  localStorage.setItem('ws:speed', speed.value);
});

transcriptToggle.addEventListener('click', () => {
  transcriptOpen = true;
  renderTranscript(tracks[currentIndex()]);
});

transcriptClose.addEventListener('click', () => {
  transcriptOpen = false;
  renderTranscript(tracks[currentIndex()]);
  updateTranscriptFocus();
  transcriptToggle.focus({ preventScroll: false });
});

translationToggle.addEventListener('click', () => {
  showTranslations = !showTranslations;
  localStorage.setItem('ws:show-translations', showTranslations ? '1' : '0');
  setTranslationState();
});

search.addEventListener('input', renderList);

dictionaryOpen.addEventListener('click', openDictionary);
dictionaryClose.addEventListener('click', closeDictionary);
dictionarySearch.addEventListener('input', renderDictionary);

dictionaryModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-dictionary-close]')) {
    closeDictionary();
  }
});

accountToggle.addEventListener('click', openAccountModal);
accountClose.addEventListener('click', closeAccountModal);
continueButton.addEventListener('click', continueFromLastPoint);
accountContinue.addEventListener('click', () => {
  closeAccountModal();
  continueFromLastPoint();
});

accountModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-account-close]')) {
    closeAccountModal();
  }
});

accountPin.addEventListener('input', () => {
  accountPin.value = sanitizePin(accountPin.value);
  updatePinDots();
});

pinPad.addEventListener('click', (event) => {
  const keyButton = event.target.closest('[data-pin-key]');
  if (keyButton) {
    accountPin.value = sanitizePin(`${accountPin.value}${keyButton.dataset.pinKey}`);
    updatePinDots();
    accountPin.focus({ preventScroll: true });
    return;
  }

  if (event.target.closest('[data-pin-back]')) {
    accountPin.value = accountPin.value.slice(0, -1);
    updatePinDots();
    accountPin.focus({ preventScroll: true });
    return;
  }

  if (event.target.closest('[data-pin-clear]')) {
    accountPin.value = '';
    updatePinDots();
    accountPin.focus({ preventScroll: true });
  }
});

accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = normalizeLoginName(accountName.value);
  const pin = sanitizePin(accountPin.value);
  accountName.value = name;
  accountPin.value = pin;
  updatePinDots();
  if (!name || pin.length !== 4) {
    setAccountStatus('Escribe un nombre y un PIN de 4 números.', 'error');
    return;
  }

  setAccountStatus('Sincronizando progreso...', '');
  try {
    persistPlaybackProgress({ sync: false });
    const data = await accountRequest('login', {
      name,
      pin,
      progress: progressState
    });
    saveAccountSession({ token: data.token, user: data.user });
    applyProgressState(mergeProgress(progressState, data.progress || {}));
    await accountRequest('save', { progress: progressState });
    accountPin.value = '';
    updatePinDots();
    setAccountStatus('Listo. Tu progreso queda sincronizado.', 'ok');
  } catch (error) {
    setAccountStatus(error.message || 'No se ha podido entrar.', 'error');
  }
});

accountLogout.addEventListener('click', async () => {
  try {
    await accountRequest('logout');
  } catch (_error) {
    // Local logout still matters even if the network request fails.
  }
  saveAccountSession(null);
  accountForm.hidden = false;
  setAccountStatus('Sesión cerrada. El progreso sigue guardado en este dispositivo.', 'ok');
  updateAccountUi();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !accountModal.hidden) {
    closeAccountModal();
    return;
  }

  if (event.key === 'Escape' && !dictionaryModal.hidden) {
    closeDictionary();
    return;
  }

  if (event.key === 'Escape' && transcriptOpen) {
    transcriptOpen = false;
    renderTranscript(tracks[currentIndex()]);
  }
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    filter = chip.dataset.filter;
    renderList();
  });
});

speed.value = localStorage.getItem('ws:speed') || '1';
iconButton(prevTrack, 'previous', 'Anterior');
iconButton(nextTrack, 'next', 'Siguiente');
iconButton(dictionaryClose, 'close', 'Cerrar diccionario');
iconButton(accountClose, 'close', 'Cerrar cuenta');
iconButton(transcriptClose, 'xCircleFilled', 'Cerrar texto');
const dictionaryButtonIcon = dictionaryOpen.querySelector('.dictionary-button-icon');
if (dictionaryButtonIcon) {
  dictionaryButtonIcon.innerHTML = icon('dictionary');
}
const continueIcon = continueButton.querySelector('.continue-icon');
if (continueIcon) {
  continueIcon.innerHTML = icon('play');
}
updateStats();
updateAccountUi();
updateContinueUi();
updatePinDots();
setPlayerVisible(false);
selectTrack(currentId, false, {
  showPlayer: Boolean(urlTrack),
  openTranscript: Boolean(urlTrack) && document.body.classList.contains('player-only'),
  openTranscript: false,
  rememberSelection: false,
  persistPrevious: false
});
loadTranscriptIndex().then(() => {
  if (urlTrack && document.body.classList.contains('player-only')) {
    transcriptOpen = true;
    renderTranscript(tracks[currentIndex()]);
    document.querySelector('.shell')?.classList.add('has-transcript');
  }
  if (document.body.classList.contains('player-only')) renderMiniCard(tracks[currentIndex()]);
});
restoreAccountSession();

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = player.paused ? 'paused' : 'playing';
  }
});
