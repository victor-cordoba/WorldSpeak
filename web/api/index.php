<?php
declare(strict_types=1);

// WorldSpeak · API de cuentas y progreso (v2, multi-curso).
//
// POST JSON { "action": ..., "course": ..., ... }
// Autenticación: Authorization: Bearer <token>
//
// Acciones:
//   login    { name, pin, course?, progress? }  -> token, user, progress (del curso), courses
//   me       { course? }                        -> user, progress (del curso), courses
//   save     { course, progress }               -> ok, savedAt
//   overview {}                                 -> user, courses (resumen de todos)
//   logout   {}                                 -> ok
//
// Compatible con el contrato v1: si no llega "course", se asume tagalog-pimsleur.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/lib/db.php';

const WS_DEFAULT_COURSE = 'tagalog-pimsleur';
const WS_MAX_ATTEMPTS = 8;
const WS_BLOCK_MINUTES = 15;

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): void
{
    respond(['ok' => false, 'error' => $message], $status);
}

function read_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function clean_name(string $name): string
{
    $name = trim(preg_replace('/\s+/', ' ', $name) ?? '');
    if (class_exists('Normalizer')) {
        $normalized = Normalizer::normalize($name, Normalizer::FORM_C);
        if (is_string($normalized)) {
            $name = $normalized;
        }
    }
    return function_exists('mb_substr') ? mb_substr($name, 0, 80) : substr($name, 0, 80);
}

function strip_accents(string $value): string
{
    if (class_exists('Normalizer')) {
        $decomposed = Normalizer::normalize($value, Normalizer::FORM_D);
        if (is_string($decomposed)) {
            $value = preg_replace('/\p{Mn}+/u', '', $decomposed) ?? $value;
        }
    }
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
    return is_string($ascii) && $ascii !== '' ? $ascii : $value;
}

// Mismo cálculo de id que la v1: los usuarios migrados conservan su id.
function user_id_for(string $name): string
{
    $key = strip_accents(clean_name($name));
    $key = function_exists('mb_strtolower') ? mb_strtolower($key, 'UTF-8') : strtolower($key);
    $key = trim(preg_replace('/\s+/', ' ', $key) ?? $key);
    return hash('sha256', $key);
}

function clean_course(string $course): string
{
    $course = strtolower(trim($course));
    if ($course === '' ) {
        return WS_DEFAULT_COURSE;
    }
    if (!preg_match('/^[a-z0-9][a-z0-9-]{1,63}$/', $course)) {
        fail('Curso no válido.');
    }
    return $course;
}

function normalize_progress($progress): array
{
    if (!is_array($progress)) {
        return [];
    }
    $encoded = json_encode($progress, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($encoded === false || strlen($encoded) > 300000) {
        return [];
    }
    return $progress;
}

function progress_summary(array $progress): array
{
    $last = is_array($progress['lastPlayed'] ?? null) ? $progress['lastPlayed'] : [];
    return [
        'done_count' => is_array($progress['done'] ?? null) ? count($progress['done']) : 0,
        'total_seconds' => (float)($progress['totalSeconds'] ?? 0),
        'last_track' => isset($last['id']) ? (string)$last['id'] : null,
        'last_position' => (float)($last['position'] ?? 0),
    ];
}

function client_ip(): string
{
    $forwarded = (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($forwarded !== '') {
        return trim(explode(',', $forwarded)[0]);
    }
    return (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

function bearer_token(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (is_string($header) && preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }
    return '';
}

// ---------------------------------------------------------------- datos

function get_user(PDO $db, string $id): ?array
{
    $stmt = $db->prepare('SELECT id, name, pin_hash, email, created_at, updated_at FROM ws_users WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function user_from_token(PDO $db): ?array
{
    $token = bearer_token();
    if ($token === '') {
        return null;
    }
    $stmt = $db->prepare('SELECT u.id, u.name, u.email FROM ws_sessions s JOIN ws_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?');
    $stmt->execute([hash('sha256', $token), ws_now()]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function create_session(PDO $db, string $userId): string
{
    $token = bin2hex(random_bytes(32));
    $days = (int)ws_config('session_days', 120);
    $db->prepare('INSERT INTO ws_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        ->execute([hash('sha256', $token), $userId, ws_now(), gmdate('Y-m-d H:i:s', time() + $days * 86400)]);
    // Limpieza barata de sesiones caducadas y tope de 8 por usuario.
    $db->prepare('DELETE FROM ws_sessions WHERE expires_at <= ?')->execute([ws_now()]);
    $db->prepare('DELETE FROM ws_sessions WHERE user_id = ? AND token_hash NOT IN (SELECT token_hash FROM (SELECT token_hash FROM ws_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 8) AS keep)')
        ->execute([$userId, $userId]);
    return $token;
}

function get_progress(PDO $db, string $userId, string $course): array
{
    $stmt = $db->prepare('SELECT progress_json FROM ws_progress WHERE user_id = ? AND course_id = ?');
    $stmt->execute([$userId, $course]);
    $row = $stmt->fetch();
    if (!$row) {
        return [];
    }
    $data = json_decode((string)$row['progress_json'], true);
    return is_array($data) ? $data : [];
}

function save_progress(PDO $db, string $userId, string $course, array $progress): void
{
    $summary = progress_summary($progress);
    $json = json_encode($progress, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $now = ws_now();
    $stmt = $db->prepare('SELECT 1 FROM ws_progress WHERE user_id = ? AND course_id = ?');
    $stmt->execute([$userId, $course]);
    if ($stmt->fetch()) {
        $db->prepare('UPDATE ws_progress SET progress_json = ?, done_count = ?, total_seconds = ?, last_track = ?, last_position = ?, updated_at = ? WHERE user_id = ? AND course_id = ?')
            ->execute([$json, $summary['done_count'], $summary['total_seconds'], $summary['last_track'], $summary['last_position'], $now, $userId, $course]);
    } else {
        $db->prepare('INSERT INTO ws_progress (user_id, course_id, progress_json, done_count, total_seconds, last_track, last_position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$userId, $course, $json, $summary['done_count'], $summary['total_seconds'], $summary['last_track'], $summary['last_position'], $now]);
    }
    $db->prepare('UPDATE ws_users SET updated_at = ? WHERE id = ?')->execute([$now, $userId]);
}

function courses_overview(PDO $db, string $userId): array
{
    $stmt = $db->prepare('SELECT course_id, done_count, total_seconds, last_track, last_position, updated_at FROM ws_progress WHERE user_id = ? ORDER BY updated_at DESC');
    $stmt->execute([$userId]);
    $rows = [];
    foreach ($stmt->fetchAll() as $row) {
        $rows[] = [
            'course' => $row['course_id'],
            'doneCount' => (int)$row['done_count'],
            'totalSeconds' => (float)$row['total_seconds'],
            'lastTrack' => $row['last_track'],
            'lastPosition' => (float)$row['last_position'],
            'updatedAt' => $row['updated_at'],
        ];
    }
    return $rows;
}

function public_user(array $user): array
{
    return ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'] ?? null];
}

// ---------------------------------------------------------------- acciones

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Método no permitido.', 405);
}

$body = read_body();
$action = (string)($body['action'] ?? '');
$course = clean_course((string)($body['course'] ?? ''));
if (!in_array($action, ['login', 'me', 'save', 'overview', 'logout'], true)) {
    fail('Acción no reconocida.');
}

try {
    $db = ws_db();
} catch (Throwable $error) {
    fail('No se ha podido abrir el almacén de progreso.', 500);
}

if ($action === 'login') {
    $name = clean_name((string)($body['name'] ?? ''));
    $pin = (string)($body['pin'] ?? '');
    if ($name === '' || !preg_match('/^[0-9]{4}$/', $pin)) {
        fail('Escribe un nombre y un PIN de 4 números.');
    }

    $id = user_id_for($name);
    $rateKey = hash('sha256', client_ip() . '|' . $id);
    $now = time();

    $stmt = $db->prepare('SELECT count, blocked_until FROM ws_rate_limits WHERE rate_key = ?');
    $stmt->execute([$rateKey]);
    $rate = $stmt->fetch() ?: ['count' => 0, 'blocked_until' => 0];
    if ((int)$rate['blocked_until'] > $now) {
        $wait = max(1, (int)ceil(((int)$rate['blocked_until'] - $now) / 60));
        fail("Demasiados intentos. Prueba otra vez en {$wait} min.", 429);
    }

    $user = get_user($db, $id);
    $incoming = normalize_progress($body['progress'] ?? []);

    if (!$user) {
        $db->prepare('INSERT INTO ws_users (id, name, pin_hash, email, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)')
            ->execute([$id, $name, password_hash($pin, PASSWORD_DEFAULT), ws_now(), ws_now()]);
        $user = get_user($db, $id);
        if ($incoming) {
            save_progress($db, $id, $course, $incoming);
        }
    } elseif (!password_verify($pin, (string)$user['pin_hash'])) {
        $count = (int)$rate['count'] + 1;
        $blocked = $count >= WS_MAX_ATTEMPTS ? $now + WS_BLOCK_MINUTES * 60 : 0;
        $db->prepare('DELETE FROM ws_rate_limits WHERE rate_key = ?')->execute([$rateKey]);
        $db->prepare('INSERT INTO ws_rate_limits (rate_key, count, blocked_until, updated_at) VALUES (?, ?, ?, ?)')
            ->execute([$rateKey, $count, $blocked, $now]);
        fail('Ese PIN no coincide.', 401);
    }

    $db->prepare('DELETE FROM ws_rate_limits WHERE rate_key = ?')->execute([$rateKey]);
    $token = create_session($db, $id);

    respond([
        'ok' => true,
        'token' => $token,
        'user' => public_user($user),
        'course' => $course,
        'progress' => get_progress($db, $id, $course),
        'courses' => courses_overview($db, $id),
    ]);
}

$user = user_from_token($db);
if (!$user) {
    fail('Sesión caducada.', 401);
}

if ($action === 'me') {
    respond([
        'ok' => true,
        'user' => public_user($user),
        'course' => $course,
        'progress' => get_progress($db, $user['id'], $course),
        'courses' => courses_overview($db, $user['id']),
    ]);
}

if ($action === 'save') {
    $progress = normalize_progress($body['progress'] ?? []);
    save_progress($db, $user['id'], $course, $progress);
    respond(['ok' => true, 'savedAt' => gmdate('c')]);
}

if ($action === 'overview') {
    respond(['ok' => true, 'user' => public_user($user), 'courses' => courses_overview($db, $user['id'])]);
}

if ($action === 'logout') {
    $db->prepare('DELETE FROM ws_sessions WHERE token_hash = ?')->execute([hash('sha256', bearer_token())]);
    respond(['ok' => true]);
}

fail('Acción no reconocida.');
