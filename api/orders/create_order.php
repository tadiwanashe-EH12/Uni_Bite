<?php
// orders/create_order.php
require_once __DIR__ . '/../../db_config.php';
require_once __DIR__ . '/../../auth/verify_token.php';

header('Content-Type: application/json');

// Verify authentication
$auth = verifyToken();
if (!$auth['valid']) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validate order data
if (empty($data['items']) || !is_array($data['items'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid order data']);
    exit;
}

$conn = getDBConnection();
$conn->autocommit(FALSE); // Start transaction

try {
    // Create order header
    $stmt = $conn->prepare("INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, 'pending')");
    $total = calculateOrderTotal($data['items'], $conn);
    $stmt->bind_param("id", $auth['user_id'], $total);
    $stmt->execute();
    $order_id = $conn->insert_id;
    
    // Add order items
    $stmt = $conn->prepare("INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)");
    foreach ($data['items'] as $item) {
        $stmt->bind_param("iiid", $order_id, $item['id'], $item['quantity'], $item['price']);
        $stmt->execute();
    }
    
    $conn->commit();
    echo json_encode([
        'status' => 'success',
        'order_id' => $order_id,
        'total' => $total
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Order processing failed']);
}

$conn->close();

function calculateOrderTotal($items, $conn) {
    $total = 0;
    $stmt = $conn->prepare("SELECT price FROM menu_items WHERE id = ? AND is_available = 1");
    
    foreach ($items as $item) {
        $stmt->bind_param("i", $item['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            throw new Exception("Item not available: " . $item['id']);
        }
        $menuItem = $result->fetch_assoc();
        $total += $menuItem['price'] * $item['quantity'];
    }
    
    return $total;
}
?>