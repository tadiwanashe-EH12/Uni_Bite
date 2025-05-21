<?php
require_once __DIR__ . '/../db_config.php';

function rateLimit($key, $limit = 60, $period = 60) {
    $conn = getDBConnection();
    
    // Clean up old records
    $conn->query("DELETE FROM rate_limits WHERE timestamp < NOW() - INTERVAL $period SECOND");
    
    // Get current count
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM rate_limits WHERE api_key = ?");
    $stmt->bind_param("s", $key);
    $stmt->execute();
    $result = $stmt->get_result();
    $count = $result->fetch_assoc()['count'];
    
    if ($count >= $limit) {
        http_response_code(429);
        echo json_encode(['status' => 'error', 'message' => 'Rate limit exceeded']);
        exit;
    }
    
    // Record this request
    $stmt = $conn->prepare("INSERT INTO rate_limits (api_key, timestamp) VALUES (?, NOW())");
    $stmt->bind_param("s", $key);
    $stmt->execute();
    
    // Set response headers
    header("X-RateLimit-Limit: $limit");
    header("X-RateLimit-Remaining: " . ($limit - $count - 1));
    header("X-RateLimit-Reset: " . (time() + $period));
}
?>