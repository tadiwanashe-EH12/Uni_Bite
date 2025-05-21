<?php
require_once __DIR__ . '/../../db_config.php';
require_once __DIR__ . '/../../auth/verify_token.php';

header('Content-Type: application/json');

$auth = verifyToken();
if (!$auth['valid'] || $auth['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (empty($data['order_id']) || empty($data['status'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Order ID and status are required']);
    exit;
}

$validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
if (!in_array($data['status'], $validStatuses)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid status']);
    exit;
}

$conn = getDBConnection();
$stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
$stmt->bind_param("si", $data['status'], $data['order_id']);

if ($stmt->execute()) {
    // If order is being completed, create a transaction record
    if ($data['status'] === 'completed') {
        $txnStmt = $conn->prepare("INSERT INTO transactions (order_id, amount, status) VALUES (?, ?, 'completed')");
        $amountStmt = $conn->prepare("SELECT total_amount FROM orders WHERE id = ?");
        $amountStmt->bind_param("i", $data['order_id']);
        $amountStmt->execute();
        $amountResult = $amountStmt->get_result();
        $amount = $amountResult->fetch_assoc()['total_amount'];
        
        $txnStmt->bind_param("id", $data['order_id'], $amount);
        $txnStmt->execute();
        $txnStmt->close();
        $amountStmt->close();
    }
    
    echo json_encode(['status' => 'success', 'message' => 'Order updated']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Update failed']);
}

$stmt->close();
$conn->close();
?>