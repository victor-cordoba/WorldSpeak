<?php
declare(strict_types=1);

// Conexión PDO. MySQL si hay config.php, SQLite si no. Crea el esquema si falta.
function ws_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $configPath = __DIR__ . '/../config.php';
    $config = is_file($configPath) ? (require $configPath) : [];
    $isMysql = isset($config['dsn']) && strpos((string)$config['dsn'], 'mysql:') === 0;

    if ($isMysql) {
        $pdo = new PDO((string)$config['dsn'], (string)($config['user'] ?? ''), (string)($config['password'] ?? ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } else {
        $dir = __DIR__ . '/../.private';
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        $deny = $dir . '/.htaccess';
        if (!is_file($deny)) {
            file_put_contents($deny, "Require all denied\nDeny from all\n");
        }
        $pdo = new PDO('sqlite:' . $dir . '/worldspeak.sqlite', null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode=WAL');
        $pdo->exec('PRAGMA busy_timeout=5000');
    }

    ws_ensure_schema($pdo, $isMysql);
    return $pdo;
}

function ws_config(string $key, $default = null)
{
    static $config = null;
    if ($config === null) {
        $configPath = __DIR__ . '/../config.php';
        $config = is_file($configPath) ? (require $configPath) : [];
    }
    return $config[$key] ?? $default;
}

function ws_ensure_schema(PDO $pdo, bool $isMysql): void
{
    $file = __DIR__ . '/../' . ($isMysql ? 'schema.mysql.sql' : 'schema.sqlite.sql');
    $sql = file_get_contents($file);
    if ($sql === false) {
        throw new RuntimeException("No se encuentra $file");
    }
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
        $pdo->exec($statement);
    }
}

function ws_now(): string
{
    return gmdate('Y-m-d H:i:s');
}
