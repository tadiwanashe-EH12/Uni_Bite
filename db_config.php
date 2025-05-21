<?php

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'UniversityWebApp');
define('DB_NAME', 'lupane_dh_web_app');


function getDBConnection() {
    $conn = new mysqli(localhost, root, UniversityWebApp, lupane_dh_web_app);
    
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    return $conn;
}


function closeDBConnection($conn) {
    $conn->close();
}
?>