<?php
declare(strict_types=1);
// Panel mínimo de estadísticas: /api/stats.php?key=XXXX  (la clave vive en api/.private/stats_key)
require __DIR__ . '/lib/db.php';
$keyFile = __DIR__ . '/.private/stats_key';
if (!is_file($keyFile)) { file_put_contents($keyFile, bin2hex(random_bytes(12))); }
$key = trim((string)file_get_contents($keyFile));
if (($_GET['key'] ?? '') !== $key) { http_response_code(403); exit('403'); }
$db = ws_db();
$q = fn(string $sql) => $db->query($sql)->fetchAll();
$since = gmdate('Y-m-d H:i:s', time() - 30 * 86400);
$data = [
  'usuarios_registrados' => $db->query('SELECT COUNT(*) c FROM ws_users')->fetch()['c'],
  'visitantes_unicos_30d' => $db->query("SELECT COUNT(DISTINCT sid) c FROM ws_events WHERE ts >= '$since'")->fetch()['c'],
  'visitantes_unicos_hoy' => $db->query("SELECT COUNT(DISTINCT sid) c FROM ws_events WHERE ts >= '" . gmdate('Y-m-d') . "'")->fetch()['c'],
  'eventos_30d' => $q("SELECT event, COUNT(*) n FROM ws_events WHERE ts >= '$since' GROUP BY event ORDER BY n DESC"),
  'paginas_30d' => $q("SELECT page, COUNT(DISTINCT sid) visitantes, COUNT(*) vistas FROM ws_events WHERE event='pageview' AND ts >= '$since' GROUP BY page ORDER BY visitantes DESC LIMIT 20"),
  'pistas_mas_escuchadas_30d' => $q("SELECT course, track, COUNT(DISTINCT sid) oyentes, SUM(CASE WHEN event='ended' THEN 1 ELSE 0 END) terminadas FROM ws_events WHERE event IN ('play','ended') AND ts >= '$since' GROUP BY course, track ORDER BY oyentes DESC LIMIT 20"),
  'por_dia_14d' => $q("SELECT substr(ts,1,10) dia, COUNT(DISTINCT sid) visitantes, COUNT(*) eventos FROM ws_events WHERE ts >= '" . gmdate('Y-m-d', time() - 14 * 86400) . "' GROUP BY dia ORDER BY dia"),
  'progreso_usuarios' => $q("SELECT u.name, p.course_id, p.done_count, ROUND(p.total_seconds/60) minutos, p.last_track, p.updated_at FROM ws_progress p JOIN ws_users u ON u.id=p.user_id ORDER BY p.updated_at DESC LIMIT 50"),
];
header('Content-Type: text/html; charset=utf-8');
echo '<!doctype html><meta name="viewport" content="width=device-width"><title>WorldSpeak · stats</title><style>body{font:14px/1.5 -apple-system,Inter,sans-serif;margin:24px;color:#1c2130}h1{font-size:22px}h2{font-size:15px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.08em;color:#6b7282}table{border-collapse:collapse;width:100%;max-width:900px}td,th{padding:6px 10px;border-bottom:1px solid #e3e8f0;text-align:left}b.big{font-size:32px;display:block}</style>';
echo '<h1>WorldSpeak · estadísticas</h1>';
echo '<div style="display:flex;gap:24px"><div><b class="big">' . $data['visitantes_unicos_hoy'] . '</b>visitantes hoy</div><div><b class="big">' . $data['visitantes_unicos_30d'] . '</b>visitantes 30 días</div><div><b class="big">' . $data['usuarios_registrados'] . '</b>cuentas</div></div>';
foreach (['por_dia_14d' => 'Por día', 'eventos_30d' => 'Eventos (30 días)', 'paginas_30d' => 'Páginas', 'pistas_mas_escuchadas_30d' => 'Pistas más escuchadas', 'progreso_usuarios' => 'Progreso por usuario'] as $k => $title) {
    $rows = $data[$k]; echo "<h2>$title</h2><table>";
    if ($rows) { echo '<tr>' . implode('', array_map(fn($c) => "<th>$c</th>", array_keys($rows[0]))) . '</tr>'; foreach ($rows as $r) { echo '<tr>' . implode('', array_map(fn($c) => '<td>' . htmlspecialchars((string)$c) . '</td>', array_values($r))) . '</tr>'; } }
    else echo '<tr><td>Sin datos aún</td></tr>';
    echo '</table>';
}
