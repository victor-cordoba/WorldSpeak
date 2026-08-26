<?php
declare(strict_types=1);
// Copia usuarios, sesiones, progreso y eventos del SQLite local al MySQL de config.php. CLI, idempotente.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit("solo CLI\n"); }
$config = require __DIR__ . '/config.php';
$my = new PDO($config['dsn'], $config['user'], $config['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach (array_filter(array_map('trim', explode(';', (string)file_get_contents(__DIR__ . '/schema.mysql.sql')))) as $st) { $my->exec($st); }
$lite = new PDO('sqlite:' . __DIR__ . '/.private/worldspeak.sqlite');
$copy = function (string $table, array $cols, string $keyCols) use ($lite, $my) {
    $rows = $lite->query("SELECT " . implode(',', $cols) . " FROM $table")->fetchAll(PDO::FETCH_ASSOC);
    $ph = implode(',', array_fill(0, count($cols), '?'));
    $upd = implode(',', array_map(fn($c) => "$c=VALUES($c)", array_diff($cols, explode(',', $keyCols))));
    $sql = "INSERT INTO $table (" . implode(',', $cols) . ") VALUES ($ph)" . ($upd ? " ON DUPLICATE KEY UPDATE $upd" : " ON DUPLICATE KEY UPDATE {$cols[0]}={$cols[0]}");
    $st = $my->prepare($sql); $n = 0;
    foreach ($rows as $r) { $st->execute(array_values($r)); $n++; }
    echo "$table: $n filas\n";
};
$copy('ws_users', ['id','name','pin_hash','email','created_at','updated_at'], 'id');
$copy('ws_sessions', ['token_hash','user_id','created_at','expires_at'], 'token_hash');
$copy('ws_progress', ['user_id','course_id','progress_json','done_count','total_seconds','last_track','last_position','updated_at'], 'user_id,course_id');
$copy('ws_rate_limits', ['rate_key','count','blocked_until','updated_at'], 'rate_key');
try { $copy('ws_events', ['ts','sid','user_id','event','page','course','track','extra','ua'], 'id'); } catch (Throwable $e) { echo "ws_events: " . $e->getMessage() . "\n"; }
echo "OK\n";
