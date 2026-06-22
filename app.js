const audioBase = './audio/';
const assetVersion = '20260622-36';
const tracks = [];

for (let lesson = 1; lesson <= 30; lesson += 1) {
  const num = String(lesson).padStart(2, '0');
  tracks.push({
    id: `lesson-${num}-main`,
    lesson,
    kind: 'main',
    title: `Lección ${num}`,
    file: `Lesson ${num} Main.mp3`
  });
}

for (let reading = 1; reading <= 20; reading += 1) {
  const num = String(reading).padStart(2, '0');
  const pairedLesson = reading + 10;
  tracks.push({
    id: `lesson-${num}-readings`,
    lesson: pairedLesson,
    readingNumber: reading,
    kind: 'readings',
    title: `Lectura ${num}`,
    subtitle: `Para después de la lección ${String(pairedLesson).padStart(2, '0')}`,
    file: `Lesson ${num} Readings.mp3`
  });
}

const trackCopy = {
  'lesson-01-main': {
    title: 'Primer contacto',
    subtitle: 'Saludar, preguntar si entiende inglés y decir que hablas un poco.'
  },
  'lesson-02-main': {
    title: 'Entender Tagalog',
    subtitle: 'Confirmar si entiende el idioma y responder con konti.'
  },
  'lesson-03-main': {
    title: 'Saludar y responder',
    subtitle: 'Preguntar cómo está y decir que entiendes solo un poco.'
  },
  'lesson-04-main': {
    title: 'Nacionalidad y talento',
    subtitle: 'Decir de dónde eres y pedir ayuda para ubicarte.'
  },
  'lesson-05-main': {
    title: 'Pedir indicaciones',
    subtitle: 'Preguntar por calles y decir a dónde quieres ir.'
  },
  'lesson-06-main': {
    title: 'Querer comer',
    subtitle: 'Proponer comer arroz y responder sí o no.'
  },
  'lesson-07-main': {
    title: 'Plan para comer',
    subtitle: 'Elegir dónde comer y qué quieres beber.'
  },
  'lesson-08-main': {
    title: 'Pedir bebidas',
    subtitle: 'Decir qué quieres tomar y rechazar opciones.'
  },
  'lesson-09-main': {
    title: 'Qué hacemos hoy',
    subtitle: 'Proponer planes, compañía y preguntar la hora.'
  },
  'lesson-10-main': {
    title: 'Quedar más tarde',
    subtitle: 'Acordar hora para comer usando mamaya na lang.'
  },
  'lesson-11-main': {
    title: 'Hora y disponibilidad',
    subtitle: 'Proponer horarios y decir que no puedes.'
  },
  'lesson-12-main': {
    title: 'Saludo y cena',
    subtitle: 'Preguntar cómo está y quedar para mañana por la noche.'
  },
  'lesson-13-main': {
    title: 'Llamada y precios',
    subtitle: 'Hacer planes por teléfono y preguntar cuánto cuesta.'
  },
  'lesson-14-main': {
    title: 'Comprar periódico',
    subtitle: 'Pedir algo, preguntar precio y hablar de dólares o pesos.'
  },
  'lesson-15-main': {
    title: 'Comprar comida',
    subtitle: 'Hablar del dinero disponible para arroz y café.'
  },
  'lesson-16-main': {
    title: 'Para quién es',
    subtitle: 'Preguntar destinatarios, paquetes y cantidades de dinero.'
  },
  'lesson-17-main': {
    title: 'Ir de compras',
    subtitle: 'Decir que quieres comprar y que te falta dinero.'
  },
  'lesson-18-main': {
    title: 'Comprar un libro',
    subtitle: 'Pedir dinero y hablar de precios.'
  },
  'lesson-19-main': {
    title: 'Pedir en un bar',
    subtitle: 'Pedir cerveza, café y solicitar que repitan.'
  },
  'lesson-20-main': {
    title: 'Presentaciones',
    subtitle: 'Recibir a alguien y preguntar por la familia.'
  },
  'lesson-21-main': {
    title: 'Hijos y edades',
    subtitle: 'Decir si tienes hijos y cuántos años tienen.'
  },
  'lesson-22-main': {
    title: 'Familia con cortesía',
    subtitle: 'Usar po y opo hablando de hijos y familia.'
  },
  'lesson-23-main': {
    title: 'Familia y viaje',
    subtitle: 'Preguntar cuántos son y preparar indicaciones.'
  },
  'lesson-24-main': {
    title: 'Gasolina y coche',
    subtitle: 'Preguntar precios, litros y si tienen coche.'
  },
  'lesson-25-main': {
    title: 'Direcciones a Manila',
    subtitle: 'Girar izquierda, derecha, seguir recto y hablar de distancia.'
  },
  'lesson-26-main': {
    title: 'Compras de noche',
    subtitle: 'Preguntar si puedes ir a Manila y explicar por qué.'
  },
  'lesson-27-main': {
    title: 'Planes a Tagaytay',
    subtitle: 'Hablar de ir, acompañar y comprar cosas.'
  },
  'lesson-28-main': {
    title: 'Salir de viaje',
    subtitle: 'Ir a Banawe, viajar juntos y decir cuánto te quedas.'
  },
  'lesson-29-main': {
    title: 'Qué significa',
    subtitle: 'Preguntar cómo está y aclarar el significado de una frase.'
  },
  'lesson-30-main': {
    title: 'Tiempo de estancia',
    subtitle: 'Decir cuánto llevas aquí y cuánto tiempo te quedas.'
  },
  'lesson-01-readings': {
    title: 'Ortografía y sonido',
    subtitle: 'Fijar pronunciación con la escritura del Tagalog.'
  },
  'lesson-02-readings': {
    title: 'Vocales básicas',
    subtitle: 'Leer saludos y preguntas con vocales claras.'
  },
  'lesson-03-readings': {
    title: 'E e I',
    subtitle: 'Distinguir vocales y primeras combinaciones.'
  },
  'lesson-04-readings': {
    title: 'Vocales juntas',
    subtitle: 'Practicar vocales adyacentes y acentos.'
  },
  'lesson-05-readings': {
    title: 'Sonido NG',
    subtitle: 'Leer combinaciones con ng y pausas.'
  },
  'lesson-06-readings': {
    title: 'Acento grave',
    subtitle: 'Entender marcas de acento y paradas glotales.'
  },
  'lesson-07-readings': {
    title: 'Acento circunflejo',
    subtitle: 'Pronunciar cierres glotales al final.'
  },
  'lesson-08-readings': {
    title: 'Números y contracciones',
    subtitle: 'Leer números y frases cortas.'
  },
  'lesson-09-readings': {
    title: 'Ritmo de frases',
    subtitle: 'Practicar sonidos repetidos y descripciones.'
  },
  'lesson-10-readings': {
    title: 'Sin marcas de acento',
    subtitle: 'Leer frases cotidianas completas.'
  },
  'lesson-11-readings': {
    title: 'Frases de duración',
    subtitle: 'Practicar tagal, galing y expresiones de tiempo.'
  },
  'lesson-12-readings': {
    title: 'Café y respuestas',
    subtitle: 'Leer deseos, negaciones y preguntas comunes.'
  },
  'lesson-13-readings': {
    title: 'Lejos y más tarde',
    subtitle: 'Entrenar acento en frases completas.'
  },
  'lesson-14-readings': {
    title: 'Formal e informal',
    subtitle: 'Contrastar pronunciación cuidada y conversacional.'
  },
  'lesson-15-readings': {
    title: 'Combinaciones SIY/DIY',
    subtitle: 'Suavizar combinaciones frecuentes.'
  },
  'lesson-16-readings': {
    title: 'U y números',
    subtitle: 'Leer palabras cortas, números y vocal U.'
  },
  'lesson-17-readings': {
    title: 'Preguntar y escuchar',
    subtitle: 'Frases útiles para pedir y atender.'
  },
  'lesson-18-readings': {
    title: 'Negación y cantidad',
    subtitle: 'Practicar hindi, konti y agradecimientos.'
  },
  'lesson-19-readings': {
    title: 'Tagalog conversacional',
    subtitle: 'Estructura de frases y pronunciación natural.'
  },
  'lesson-20-readings': {
    title: 'Compras y horarios',
    subtitle: 'Leer frases de compra, comida y preguntas.'
  }
};

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

let currentId = localStorage.getItem('tagalog-current') || tracks[0].id;
let filter = 'all';
let transcriptIndex = new Map();
let transcriptOpen = false;
let showTranslations = localStorage.getItem('tagalog-show-translations') !== '0';
let playerVisible = false;
let dictionaryLoaded = false;
let dictionaryEntries = [];
const transcriptCache = new Map();
const done = new Set(JSON.parse(localStorage.getItem('tagalog-done') || '[]'));

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
  localStorage.setItem('tagalog-done', JSON.stringify([...done]));
  updateStats();
}

function updateStats() {
  doneCount.textContent = done.size;
  totalCount.textContent = tracks.length;
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

function updateMediaSession(track) {
  if (!('mediaSession' in navigator)) {
    return;
  }

  try {
    if ('MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'Aprende Tagalog',
        album: track.kind === 'main' ? 'Audio principal' : 'Lecturas'
      });
    }
  } catch (_error) {
    // Metadata is progressive enhancement for lock-screen controls.
  }

  setMediaSessionHandler('play', () => player.play().catch(() => {}));
  setMediaSessionHandler('pause', () => player.pause());
  setMediaSessionHandler('previoustrack', () => playPrevious());
  setMediaSessionHandler('nexttrack', () => playNext());
}

function languageLabel(language) {
  return {
    tl: 'Tagalog',
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
      const response = await fetch(`${entry.enriched}?v=${assetVersion}`, { cache: 'no-store' });
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
    transcriptTitle.textContent = fullTrackLabel(track);
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
    const response = await fetch(`./transcripts/index.json?v=${assetVersion}`, { cache: 'no-store' });
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
  tagalog.textContent = entry.tagalog || '';

  const spanish = document.createElement('p');
  spanish.textContent = entry.spanish || '';

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
      `${entry.tagalog || ''} ${entry.spanish || ''} ${entry.topic || ''} ${(entry.sources || []).join(' ')} ${dictionaryTypeLabel(entry.type)}`
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
    const response = await fetch(`./transcripts/dictionary.json?v=${assetVersion}`, { cache: 'no-store' });
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
  const { showPlayer = true, openTranscript = true } = options;
  const track = tracks.find((item) => item.id === id) || tracks[0];
  currentId = track.id;
  localStorage.setItem('tagalog-current', currentId);
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
  if (player.currentSrc !== nextSrc && player.src !== nextSrc) {
    resetProgressDisplay();
    player.src = srcFor(track);
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
    card.className = `lesson-card ${track.kind}-track${done.has(track.id) ? ' done' : ''}`;
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
    status.className = `status-icon${done.has(track.id) ? ' is-done' : ''}`;
    status.innerHTML = icon('check');
    status.title = done.has(track.id) ? 'Completada' : 'Pendiente';
    status.setAttribute('aria-label', done.has(track.id) ? 'Completada' : 'Pendiente');

    const button = document.createElement('button');
    const isCurrent = track.id === currentId;
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
    player.play().catch(() => {});
  } else {
    player.pause();
  }
});

player.addEventListener('ended', () => {
  done.add(currentId);
  saveDone();
  updateTranscriptFocus();
  const idx = currentIndex();
  if (idx < tracks.length - 1) {
    selectTrack(tracks[idx + 1].id);
  } else {
    renderList();
  }
});

player.addEventListener('play', () => {
  setPlayerVisible(true);
  updatePlayButton();
  updateTranscriptFocus();
  renderList();
});

player.addEventListener('pause', () => {
  updatePlayButton();
  updateTranscriptFocus();
  renderList();
});

player.addEventListener('loadedmetadata', updateProgress);
player.addEventListener('timeupdate', updateProgress);
window.addEventListener('resize', updatePlayerMetrics);

progress.addEventListener('input', () => {
  if (Number.isFinite(player.duration) && player.duration > 0) {
    player.currentTime = (Number(progress.value) / 1000) * player.duration;
  }
  progress.style.setProperty('--progress', `${Number(progress.value) / 10}%`);
});

speed.addEventListener('change', () => {
  player.playbackRate = Number(speed.value);
  localStorage.setItem('tagalog-speed', speed.value);
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
  localStorage.setItem('tagalog-show-translations', showTranslations ? '1' : '0');
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

document.addEventListener('keydown', (event) => {
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

speed.value = localStorage.getItem('tagalog-speed') || '1';
iconButton(prevTrack, 'previous', 'Anterior');
iconButton(nextTrack, 'next', 'Siguiente');
iconButton(dictionaryClose, 'close', 'Cerrar diccionario');
iconButton(transcriptClose, 'xCircleFilled', 'Cerrar texto');
const dictionaryButtonIcon = dictionaryOpen.querySelector('.dictionary-button-icon');
if (dictionaryButtonIcon) {
  dictionaryButtonIcon.innerHTML = icon('dictionary');
}
updateStats();
setPlayerVisible(false);
selectTrack(currentId, false, { showPlayer: false, openTranscript: false });
loadTranscriptIndex();
