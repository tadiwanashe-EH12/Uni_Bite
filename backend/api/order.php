<?php
require_once '../config.php';
require_once '../services/DatabaseService.php';
require_once '../libs/JWTService.php';

// Set headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$dbService = new DatabaseService();
$method = $_SERVER['REQUEST_METHOD'];

// Authenticate user
function authenticate() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    $payload = JWTService::validateToken($matches[1]);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }

    return $payload['user_id'];
}

// Route requests
switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? 'create';
        if ($action === 'create') createOrder($dbService);
        break;
    case 'GET':
        $action = $_GET['action'] ?? 'list';
        if ($action === 'list') getOrders($dbService);
        elseif ($action === 'details') getOrderDetails($dbService);
        break;
    case 'PUT':
        updateOrderStatus($dbService);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

$dbService->close();

function createOrder($dbService) {
    $userId = authenticate();
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['items']) || !is_array($input['items'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Items required']);
        return;
    }

    // Calculate total and validate items
    $totalAmount = 0;
    $validItems = [];

    foreach ($input['items'] as $item) {
        if (empty($item['menu_item_id']) || empty($item['quantity'])) continue;

        $sql = "SELECT id, price, is_available FROM menu_items WHERE id = ?";
        $menuItem = $dbService->query($sql, [$item['menu_item_id']]);

        if (empty($menuItem) || !$menuItem[0]['is_available']) continue;

        $quantity = (int)$item['quantity'];
        $price = $menuItem[0]['price'];
        $totalAmount += $price * $quantity;

        $validItems[] = [
            'menu_item_id' => $item['menu_item_id'],
            'quantity' => $quantity,
            'unit_price' => $price
        ];
    }

    if (empty($validItems)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid items']);
        return;
    }

    // Check wallet balance
    $sql = "SELECT wallet_balance FROM users WHERE id = ?";
    $user = $dbService->query($sql, [$userId]);

    if ($user[0]['wallet_balance'] < $totalAmount) {
        http_response_code(400);
        echo json_encode(['error' => 'Insufficient balance']);
        return;
    }

    // Create order
    $reference = 'ORD' . time() . rand(100, 999);
    $sql = "INSERT INTO orders (user_id, reference, total_amount) VALUES (?, ?, ?)";
    $dbService->query($sql, [$userId, $reference, $totalAmount]);

    $orderId = $dbService->query("SELECT LAST_INSERT_ID() as id")[0]['id'];

    // Add order items
    foreach ($validItems as $item) {
        $sql = "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)";
        $dbService->query($sql, [$orderId, $item['menu_item_id'], $item['quantity'], $item['unit_price']]);
    }

    // Deduct from wallet
    $sql = "UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?";
    $dbService->query($sql, [$totalAmount, $userId]);

    // Create transaction record
    $sql = "INSERT INTO transactions (user_id, order_id, amount, type, method, reference) VALUES (?, ?, ?, 'payment', 'wallet', ?)";
    $dbService->query($sql, [$userId, $orderId, $totalAmount, 'PAY' . $reference]);

    echo json_encode([
        'message' => 'Order created successfully',
        'order_id' => $orderId,
        'reference' => $reference,
        'total_amount' => $totalAmount
    ]);
}

function getOrders($dbService) {
    $userId = authenticate();

    $sql = "SELECT o.*, COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC";

    $orders = $dbService->query($sql, [$userId]);
    echo json_encode(['orders' => $orders]);
}

function getOrderDetails($dbService) {
    $userId = authenticate();
    $orderId = $_GET['id'] ?? '';

    if (empty($orderId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID required']);
        return;
    }

    // Get order
    $sql = "SELECT * FROM orders WHERE id = ? AND user_id = ?";
    $order = $dbService->query($sql, [$orderId, $userId]);

    if (empty($order)) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        return;
    }

    // Get order items
    $sql = "SELECT oi.*, mi.name, mi.description
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = ?";

    $items = $dbService->query($sql, [$orderId]);

    echo json_encode([
        'order' => $order[0],
        'items' => $items
    ]);
}

function updateOrderStatus($dbService) {
    // Only for staff/admin - simplified version
    $input = json_decode(file_get_contents('php://input'), true);
    $orderId = $input['order_id'] ?? '';
    $status = $input['status'] ?? '';

    if (empty($orderId) || empty($status)) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID and status required']);
        return;
    }

    $validStatuses = ['pending', 'preparing', 'ready', 'collected', 'cancelled'];
    if (!in_array($status, $validStatuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        return;
    }

    $sql = "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?";
    if ($status === 'collected') {
        $sql = "UPDATE orders SET status = ?, updated_at = NOW(), collected_at = NOW() WHERE id = ?";
    }

    $result = $dbService->query($sql, [$status, $orderId]);

    if ($result > 0) {
        echo json_encode(['message' => 'Order status updated']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
    }
}
?>