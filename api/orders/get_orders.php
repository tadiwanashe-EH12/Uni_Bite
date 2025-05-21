<?php
require_once __DIR__ . '/../../db_config.php';
require_once __DIR__ . '/../../auth/verify_token.php';

header('Content-Type: application/json');

$auth = verifyToken();
if (!$auth['valid']) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();

// Different query based on user role
if ($auth['role'] === 'admin') {
    // Admin can see all orders
    $query = "SELECT o.id, u.name as user_name, o.total_amount, o.status, o.created_at 
              FROM orders o 
              JOIN users u ON o.user_id = u.id 
              ORDER BY o.created_at DESC";
    $stmt = $conn->prepare($query);
} else {
    // Regular users only see their own orders
    $query = "SELECT id, total_amount, status, created_at 
              FROM orders 
              WHERE user_id = ? 
              ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $auth['user_id']);
}

$stmt->execute();
$result = $stmt->get_result();

$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode([
    'status' => 'success',
    'data' => $orders
]);

$stmt->close();
$conn->close();
?>