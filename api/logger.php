<?php
function logActivity($message, $context = []) {
    $logDir = __DIR__ . '/../../logs/';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $message,
        'context' => $context,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $logEntry = json_encode($logData) . PHP_EOL;
    file_put_contents($logDir . 'activity_' . date('Y-m-d') . '.log', $logEntry, FILE_APPEND);
}

function logError($error, $context = []) {
    $logDir = __DIR__ . '/../../logs/';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'error' => $error,
        'context' => $context,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'request' => [
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'uri' => $_SERVER['REQUEST_URI'] ?? ''
        ]
    ];
    
    $logEntry = json_encode($logData) . PHP_EOL;
    file_put_contents($logDir . 'errors_' . date('Y-m-d') . '.log', $logEntry, FILE_APPEND);
}
?>