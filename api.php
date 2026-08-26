<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dataDir = __DIR__ . '/.private';
$storePath = $dataDir . '/tagalog-users.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0700, true);
}

$denyFile = $dataDir . '/.htaccess';
if (!is_file($denyFile)) {
    file_put_contents($denyFile, "Require all denied\nDeny from all\n");
}

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respond_result(array $payload): void
{
    $status = isset($payload['status']) ? (int)$payload['status'] : 200;
    unset($payload['status']);
    respond($payload, $status);
}

function read_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function clean_name(string $name): string
{
    $name = trim(preg_replace('/\s+/', ' ', $name));
    if (class_exists('Normalizer')) {
        $normalized = Normalizer::normalize($name, Normalizer::FORM_C);
        if (is_string($normalized)) {
            $name = $normalized;
        }
    }
    if (function_exists('mb_substr')) {
        return mb_substr($name, 0, 80);
    }
    return substr($name, 0, 80);
}

function lower_text(string $value): string
{
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($value, 'UTF-8');
    }
    return strtolower($value);
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

function name_key_for(string $name): string
{
    $key = lower_text(strip_accents(clean_name($name)));
    $key = preg_replace('/\s+/', ' ', $key) ?? $key;
    return trim($key);
}

function user_id_for(string $name): string
{
    return hash('sha256', name_key_for($name));
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

function blank_store(): array
{
    return [
        'version' => 1,
        'users' => [],
        'rateLimits' => []
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

function rate_key_for(string $id): string
{
    return hash('sha256', client_ip() . '|' . $id);
}

function with_store(string $path, callable $callback): array
{
    $handle = fopen($path, 'c+');
    if (!$handle) {
        respond(['ok' => false, 'error' => 'No se ha podido abrir el almacén de progreso.'], 500);
    }

    flock($handle, LOCK_EX);
    rewind($handle);
    $raw = stream_get_contents($handle);
    $store = $raw ? json_decode($raw, true) : null;
    if (!is_array($store) || !isset($store['users']) || !is_array($store['users'])) {
        $store = blank_store();
    }
    if (!isset($store['rateLimits']) || !is_array($store['rateLimits'])) {
        $store['rateLimits'] = [];
    }

    $result = $callback($store);

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    return is_array($result) ? $result : ['ok' => true];
}

function bearer_token(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }
    return '';
}

function find_user_by_token(array &$store, string $token): ?array
{
    if ($token === '') {
        return null;
    }

    $tokenHash = hash('sha256', $token);
    $now = time();
    foreach ($store['users'] as $id => &$user) {
        $sessions = $user['sessions'] ?? [];
        foreach ($sessions as $index => $session) {
            if (($session['expiresAt'] ?? 0) < $now) {
                unset($user['sessions'][$index]);
                continue;
            }

            if (($session['tokenHash'] ?? '') === $tokenHash) {
                return ['id' => $id, 'user' => &$user];
            }
        }
        $user['sessions'] = array_values($user['sessions'] ?? []);
    }

    return null;
}

$body = read_body();
$action = (string)($body['action'] ?? '');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

if ($action === 'login') {
    $name = clean_name((string)($body['name'] ?? ''));
    $pin = (string)($body['pin'] ?? '');

    if ($name === '' || !preg_match('/^[0-9]{4}$/', $pin)) {
        respond(['ok' => false, 'error' => 'Escribe un nombre y un PIN de 4 números.'], 400);
    }

    $id = user_id_for($name);
    $progress = normalize_progress($body['progress'] ?? []);
    $rateKey = rate_key_for($id);

    respond_result(with_store($storePath, function (&$store) use ($id, $name, $pin, $progress, $rateKey) {
        $now = time();
        $rate = $store['rateLimits'][$rateKey] ?? ['count' => 0, 'blockedUntil' => 0];
        if (($rate['blockedUntil'] ?? 0) > $now) {
            $wait = max(1, (int)ceil((($rate['blockedUntil'] ?? $now) - $now) / 60));
            return ['ok' => false, 'error' => "Demasiados intentos. Prueba otra vez en {$wait} min.", 'status' => 429];
        }

        $isNew = !isset($store['users'][$id]);
        if ($isNew) {
            $store['users'][$id] = [
                'name' => $name,
                'pinHash' => password_hash($pin, PASSWORD_DEFAULT),
                'progress' => $progress,
                'sessions' => [],
                'createdAt' => gmdate('c'),
                'updatedAt' => gmdate('c')
            ];
        } elseif (!password_verify($pin, (string)($store['users'][$id]['pinHash'] ?? ''))) {
            $count = (int)($rate['count'] ?? 0) + 1;
            $store['rateLimits'][$rateKey] = [
                'count' => $count,
                'blockedUntil' => $count >= 8 ? $now + 15 * 60 : 0,
                'updatedAt' => $now
            ];
            return ['ok' => false, 'error' => 'Ese PIN no coincide.', 'status' => 401];
        }

        $store['rateLimits'][$rateKey] = [
            'count' => 0,
            'blockedUntil' => 0,
            'updatedAt' => $now
        ];

        if (!$isNew && $progress) {
            $store['users'][$id]['progress'] = $progress;
        }

        $token = bin2hex(random_bytes(32));
        $sessions = $store['users'][$id]['sessions'] ?? [];
        $sessions[] = [
            'tokenHash' => hash('sha256', $token),
            'createdAt' => time(),
            'expiresAt' => time() + 60 * 60 * 24 * 120
        ];
        $store['users'][$id]['sessions'] = array_slice($sessions, -8);
        $store['users'][$id]['name'] = $name;
        $store['users'][$id]['updatedAt'] = gmdate('c');

        return [
            'ok' => true,
            'token' => $token,
            'user' => ['id' => $id, 'name' => $store['users'][$id]['name']],
            'progress' => $store['users'][$id]['progress'] ?? []
        ];
    }));
}

if ($action === 'me') {
    respond_result(with_store($storePath, function (&$store) {
        $session = find_user_by_token($store, bearer_token());
        if (!$session) {
            return ['ok' => false, 'error' => 'Sesión caducada.', 'status' => 401];
        }

        return [
            'ok' => true,
            'user' => ['id' => $session['id'], 'name' => $session['user']['name'] ?? ''],
            'progress' => $session['user']['progress'] ?? []
        ];
    }));
}

if ($action === 'save') {
    $progress = normalize_progress($body['progress'] ?? []);
    respond_result(with_store($storePath, function (&$store) use ($progress) {
        $session = find_user_by_token($store, bearer_token());
        if (!$session) {
            return ['ok' => false, 'error' => 'Sesión caducada.', 'status' => 401];
        }

        $store['users'][$session['id']]['progress'] = $progress;
        $store['users'][$session['id']]['updatedAt'] = gmdate('c');
        return ['ok' => true, 'savedAt' => gmdate('c')];
    }));
}

if ($action === 'logout') {
    respond_result(with_store($storePath, function (&$store) {
        $token = bearer_token();
        $tokenHash = hash('sha256', $token);
        foreach ($store['users'] as &$user) {
            $sessions = $user['sessions'] ?? [];
            $user['sessions'] = array_values(array_filter($sessions, function ($session) use ($tokenHash) {
                return ($session['tokenHash'] ?? '') !== $tokenHash;
            }));
        }
        return ['ok' => true];
    }));
}

respond(['ok' => false, 'error' => 'Acción no reconocida.'], 400);
