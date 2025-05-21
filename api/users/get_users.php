<?php
require_once __DIR__ . '/../../db_config.php';
require_once __DIR__ . '/../../auth/verify_token.php';

header('Content-Type: application/json');

// Verify authentication and admin role
$auth = verifyToken();
if (!$auth['valid'] || $auth['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$conn = getDBConnection();

// Pagination parameters
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$offset = ($page - 1) * $limit;

// Get users with pagination
$stmt = $conn->prepare("SELECT id, name, email, role, created_at FROM users LIMIT ? OFFSET ?");
$stmt->bind_param("ii", $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

// Get total count for pagination
$countResult = $conn->query("SELECT COUNT(*) as total FROM users");
$total = $countResult->fetch_assoc()['total'];

echo json_encode([
    'status' => 'success',
    'data' => $users,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'pages' => ceil($total / $limit)
    ]
]);

$stmt->close();
$conn->close();
?>