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

$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (empty($data['id']) || ($auth['role'] !== 'admin' && $auth['user_id'] != $data['id'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$conn = getDBConnection();

// Build dynamic update query based on provided fields
$updates = [];
$params = [];
$types = '';

$allowedFields = ['name', 'email', 'password'];
if ($auth['role'] === 'admin') {
    $allowedFields[] = 'role';
}

foreach ($data as $key => $value) {
    if (in_array($key, $allowedFields)) {
        $updates[] = "$key = ?";
        $params[] = $value;
        $types .= $key === 'password' ? 's' : (is_int($value) ? 'i' : 's');
    }
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'No valid fields to update']);
    exit;
}

// Hash password if being updated
if (isset($data['password'])) {
    $params[array_search($data['password'], $params)] = password_hash($data['password'], PASSWORD_BCRYPT);
}

$params[] = $data['id'];
$types .= 'i';

$query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'User updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Update failed']);
}

$stmt->close();
$conn->close();
?>