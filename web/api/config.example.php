<?php
// WorldSpeak · configuración del backend.
// Copia este archivo a config.php EN EL SERVIDOR (config.php está en .gitignore).
// Si config.php no existe, el backend usa SQLite en ./.private/worldspeak.sqlite
// y funciona igual. Para pasar a MySQL basta con crear config.php.
return [
    // MySQL en Hostinger (hPanel > Bases de datos > MySQL)
    'dsn'      => 'mysql:host=localhost;dbname=uXXXXXXXXX_worldspeak;charset=utf8mb4',
    'user'     => 'uXXXXXXXXX_worldspeak',
    'password' => 'CAMBIAME',

    // Sesiones: días de validez del token
    'session_days' => 120,
];
