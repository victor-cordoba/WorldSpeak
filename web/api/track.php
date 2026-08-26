<?php
declare(strict_types=1);
// Analítica propia, sin cookies de terceros: POST JSON { sid, event, page, course, track, extra }
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require __DIR__ . '/lib/db.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }
$b = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($b)) { http_response_code(400); echo '{"ok":false}'; exit; }
$clip = fn($v, $n) => mb_substr(trim((string)($v ?? '')), 0, $n);
$sid = preg_replace('/[^a-zA-Z0-9]/', '', (string)($b['sid'] ?? ''));
$event = preg_replace('/[^a-z0-9_]/', '', strtolower((string)($b['event'] ?? '')));
if ($sid === '' || $event === '') { http_response_code(400); echo '{"ok":false}'; exit; }
$userId = null;
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
try {
    $db = ws_db();
    if (is_string($auth) && preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
        $st = $db->prepare('SELECT user_id FROM ws_sessions WHERE token_hash = ?'); $st->execute([hash('sha256', trim($m[1]))]);
        $userId = ($st->fetch()['user_id'] ?? null) ?: null;
    }
    $db->prepare('INSERT INTO ws_events (ts, sid, user_id, event, page, course, track, extra, ua) VALUES (?,?,?,?,?,?,?,?,?)')
       ->execute([ws_now(), mb_substr($sid, 0, 24), $userId, mb_substr($event, 0, 40), $clip($b['page'], 120), $clip($b['course'], 64), $clip($b['track'], 80), $clip($b['extra'], 255), $clip($_SERVER['HTTP_USER_AGENT'] ?? '', 160)]);
} catch (Throwable $e) { http_response_code(500); echo '{"ok":false}'; exit; }
echo '{"ok":true}';
