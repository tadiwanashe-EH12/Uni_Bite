<?php 
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'UniversityWebApp');
define('DB_NAME', 'lupane_dh_web_app');

define('JWT_SECRET', 'your-very-secret-key-here');
define('JWT_EXPIRE', 3600); // 1 hour in seconds

// Password hashing
define('PASSWORD_ALGO', PASSWORD_BCRYPT);
define('PASSWORD_OPTIONS', ['cost' => 12]);

// CORS
define('ALLOWED_ORIGINS', ['http://localhost:3000', 'https://yourdomain.com', 'http://127.0.0.1:5500']);
?>