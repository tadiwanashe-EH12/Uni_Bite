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

// Validate payment data
if (empty($data['order_id']) || empty($data['amount']) || empty($data['payment_method'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

$conn = getDBConnection();
$conn->autocommit(FALSE);

try {
    // Verify order exists and belongs to user (unless admin)
    $orderQuery = $auth['role'] === 'admin' 
        ? "SELECT id, total_amount, user_id FROM orders WHERE id = ?"
        : "SELECT id, total_amount, user_id FROM orders WHERE id = ? AND user_id = ?";
    
    $stmt = $conn->prepare($orderQuery);
    if ($auth['role'] === 'admin') {
        $stmt->bind_param("i", $data['order_id']);
    } else {
        $stmt->bind_param("ii", $data['order_id'], $auth['user_id']);
    }
    
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();
    
    if (!$order) {
        throw new Exception("Order not found or unauthorized");
    }
    
    // Verify payment amount matches order total (with small tolerance for floating point)
    if (abs($data['amount'] - $order['total_amount']) > 0.01) {
        throw new Exception("Payment amount doesn't match order total");
    }
    
    // Record payment
    $paymentStmt = $conn->prepare("
        INSERT INTO transactions (order_id, user_id, amount, payment_method, status) 
        VALUES (?, ?, ?, ?, 'completed')
    ");
    $paymentStmt->bind_param("iids", $data['order_id'], $order['user_id'], $data['amount'], $data['payment_method']);
    $paymentStmt->execute();
    
    // Update order status
    $updateStmt = $conn->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
    $updateStmt->bind_param("i", $data['order_id']);
    $updateStmt->execute();
    
    $conn->commit();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Payment processed successfully',
        'transaction_id' => $conn->insert_id
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>