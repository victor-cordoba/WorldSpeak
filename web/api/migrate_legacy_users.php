<?php
declare(strict_types=1);
// Migra el almacén v1 (.private/tagalog-users.json) a la base de datos v2.
// Uso (CLI, en el servidor):  php migrate_legacy_users.php /ruta/tagalog-users.json
// Idempotente: los usuarios que ya existen no se tocan salvo que su progreso
// migrado sea más reciente que el guardado.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit("solo CLI\n"); }
require __DIR__ . '/lib/db.php';
$path = $argv[1] ?? '';
if (!is_file($path)) { exit("No existe $path\n"); }
$store = json_decode((string)file_get_contents($path), true);
$users = is_array($store['users'] ?? null) ? $store['users'] : [];
$db = ws_db();
$course = 'tagalog-pimsleur';
$created = 0; $updated = 0; $skipped = 0;
foreach ($users as $id => $u) {
    $name = (string)($u['name'] ?? '');
    $pinHash = (string)($u['pinHash'] ?? '');
    if ($name === '' || $pinHash === '') { $skipped++; continue; }
    $createdAt = isset($u['createdAt']) ? gmdate('Y-m-d H:i:s', strtotime((string)$u['createdAt'])) : ws_now();
    $updatedAt = isset($u['updatedAt']) ? gmdate('Y-m-d H:i:s', strtotime((string)$u['updatedAt'])) : ws_now();
    $exists = $db->prepare('SELECT updated_at FROM ws_users WHERE id = ?'); $exists->execute([$id]); $row = $exists->fetch();
    if (!$row) {
        $db->prepare('INSERT INTO ws_users (id, name, pin_hash, email, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)')->execute([$id, $name, $pinHash, $createdAt, $updatedAt]);
        $created++;
    } else { $updated++; }
    $progress = is_array($u['progress'] ?? null) ? $u['progress'] : [];
    if ($progress) {
        $cur = $db->prepare('SELECT updated_at FROM ws_progress WHERE user_id = ? AND course_id = ?'); $cur->execute([$id, $course]); $curRow = $cur->fetch();
        if (!$curRow || $curRow['updated_at'] <= $updatedAt) {
            $json = json_encode($progress, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $last = is_array($progress['lastPlayed'] ?? null) ? $progress['lastPlayed'] : [];
            $db->prepare('DELETE FROM ws_progress WHERE user_id = ? AND course_id = ?')->execute([$id, $course]);
            $db->prepare('INSERT INTO ws_progress (user_id, course_id, progress_json, done_count, total_seconds, last_track, last_position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([$id, $course, $json, count($progress['done'] ?? []), (float)($progress['totalSeconds'] ?? 0), $last['id'] ?? null, (float)($last['position'] ?? 0), $updatedAt]);
        }
    }
}
echo "usuarios creados: $created, ya existían: $updated, saltados: $skipped\n";
