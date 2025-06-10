<?php
require_once '../config.php';
require_once '../services/DatabaseService.php';
require_once '../libs/JWTService.php';

// Set headers
header("Content-Type: application/json");

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Methods: POST,GET,PUT,DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Initialize database service
$dbService = new DatabaseService();

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

// Route the request
switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';
        switch ($action) {
            case 'list':
                handleGetMenuItems($dbService);
                break;
            case 'categories':
                handleGetCategories($dbService);
                break;
            case 'item':
                handleGetMenuItem($dbService);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        break;
    case 'POST':
        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'add':
                handleAddMenuItem($dbService);
                break;
            case 'category':
                handleAddCategory($dbService);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        break;
    case 'PUT':
        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'update':
                handleUpdateMenuItem($dbService);
                break;
            case 'availability':
                handleUpdateAvailability($dbService);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        break;
    case 'DELETE':
        handleDeleteMenuItem($dbService);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

$dbService->close();

function validateStaffToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token not provided']);
        return false;
    }

    $token = $matches[1];
    $payload = JWTService::validateToken($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        return false;
    }

    return $payload['user_id'];
}

function checkStaffRole($dbService, $userId) {
    $sql = "SELECT role FROM users WHERE id = ?";
    $result = $dbService->query($sql, [$userId]);

    if (empty($result)) {
        return false;
    }

    $role = $result[0]['role'];
    return in_array($role, ['dh_staff', 'admin']);
}

function handleGetMenuItems($dbService) {
    $category = $_GET['category'] ?? '';
    $available_only = $_GET['available'] ?? 'true';

    $sql = "SELECT m.*, c.name as category_name FROM menu_items m
            LEFT JOIN menu_categories c ON m.category_id = c.id";
    $params = [];
    $conditions = [];

    if ($available_only === 'true') {
        $conditions[] = "m.is_available = 1 AND c.is_active = 1";
    }

    if (!empty($category)) {
        $conditions[] = "c.id = ?";
        $params[] = $category;
    }

    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }

    $sql .= " ORDER BY c.id, m.name";

    $result = $dbService->query($sql, $params);

    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
}

function handleGetCategories($dbService) {
    $sql = "SELECT * FROM menu_categories WHERE is_active = 1 ORDER BY id";
    $result = $dbService->query($sql);

    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
}

function handleGetMenuItem($dbService) {
    $id = $_GET['id'] ?? '';

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Menu item ID is required']);
        return;
    }

    $sql = "SELECT m.*, c.name as category_name FROM menu_items m
            LEFT JOIN menu_categories c ON m.category_id = c.id
            WHERE m.id = ?";
    $result = $dbService->query($sql, [$id]);

    if (empty($result)) {
        http_response_code(404);
        echo json_encode(['error' => 'Menu item not found']);
        return;
    }

    echo json_encode([
        'success' => true,
        'data' => $result[0]
    ]);
}

function handleAddMenuItem($dbService) {
    $userId = validateStaffToken();
    if (!$userId) return;

    if (!checkStaffRole($dbService, $userId)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Staff role required.']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    $required = ['name', 'price', 'category_id'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => ucfirst($field) . ' is required']);
            return;
        }
    }

    if (!is_numeric($input['price']) || $input['price'] <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Price must be a positive number']);
        return;
    }

    // Check if category exists
    $categorySql = "SELECT id FROM menu_categories WHERE id = ? AND is_active = 1";
    $categoryCheck = $dbService->query($categorySql, [$input['category_id']]);

    if (empty($categoryCheck)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid category']);
        return;
    }

    $sql = "INSERT INTO menu_items (name, description, price, category_id, is_available)
            VALUES (?, ?, ?, ?, ?)";

    $params = [
        $input['name'],
        $input['description'] ?? null,
        $input['price'],
        $input['category_id'],
        $input['is_available'] ?? 1
    ];

    $result = $dbService->query($sql, $params);

    if ($result > 0) {
        $itemId = $dbService->query("SELECT LAST_INSERT_ID() as id")[0]['id'];
        http_response_code(201);
        echo json_encode(['message' => 'Menu item added successfully', 'item_id' => $itemId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add menu item']);
    }
}

function handleAddCategory($dbService) {
    $userId = validateStaffToken();
    if (!$userId) return;

    if (!checkStaffRole($dbService, $userId)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Staff role required.']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Category name is required']);
        return;
    }

    $sql = "INSERT INTO menu_categories (name, description, is_active) VALUES (?, ?, ?)";
    $params = [
        $input['name'],
        $input['description'] ?? '',
        $input['is_active'] ?? 1
    ];

    $result = $dbService->query($sql, $params);

    if ($result > 0) {
        $categoryId = $dbService->query("SELECT LAST_INSERT_ID() as id")[0]['id'];
        http_response_code(201);
        echo json_encode(['message' => 'Category added successfully', 'category_id' => $categoryId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add category']);
    }
}

function handleUpdateMenuItem($dbService) {
    $userId = validateStaffToken();
    if (!$userId) return;

    if (!checkStaffRole($dbService, $userId)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Staff role required.']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? $input['id'] ?? '';

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Menu item ID is required']);
        return;
    }

    // Check if item exists
    $checkSql = "SELECT id FROM menu_items WHERE id = ?";
    $existing = $dbService->query($checkSql, [$id]);

    if (empty($existing)) {
        http_response_code(404);
        echo json_encode(['error' => 'Menu item not found']);
        return;
    }

    $updateFields = [];
    $params = [];

    $allowedFields = ['name', 'description', 'price', 'category_id', 'is_available'];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            if ($field === 'price' && (!is_numeric($input[$field]) || $input[$field] <= 0)) {
                http_response_code(400);
                echo json_encode(['error' => 'Price must be a positive number']);
                return;
            }
            $updateFields[] = "$field = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        return;
    }

    $updateFields[] = "updated_at = NOW()";
    $params[] = $id;
    $sql = "UPDATE menu_items SET " . implode(', ', $updateFields) . " WHERE id = ?";

    $result = $dbService->query($sql, $params);

    if ($result !== false) {
        echo json_encode(['message' => 'Menu item updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update menu item']);
    }
}

function handleUpdateAvailability($dbService) {
    $userId = validateStaffToken();
    if (!$userId) return;

    if (!checkStaffRole($dbService, $userId)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Staff role required.']);
        return;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? $input['id'] ?? '';

    if (empty($id) || !isset($input['is_available'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Menu item ID and availability status are required']);
        return;
    }

    $sql = "UPDATE menu_items SET is_available = ?, updated_at = NOW() WHERE id = ?";
    $result = $dbService->query($sql, [$input['is_available'], $id]);

    if ($result !== false) {
        echo json_encode(['message' => 'Availability updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update availability']);
    }
}

function handleDeleteMenuItem($dbService) {
    $userId = validateStaffToken();
    if (!$userId) return;

    if (!checkStaffRole($dbService, $userId)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Staff role required.']);
        return;
    }

    $id = $_GET['id'] ?? '';

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Menu item ID is required']);
        return;
    }

    // Check if item exists and is not used in any orders
    $checkSql = "SELECT m.id FROM menu_items m
                 LEFT JOIN order_items oi ON m.id = oi.menu_item_id
                 WHERE m.id = ?";
    $existing = $dbService->query($checkSql, [$id]);

    if (empty($existing)) {
        http_response_code(404);
        echo json_encode(['error' => 'Menu item not found']);
        return;
    }

    // Check if item has been ordered
    $orderCheckSql = "SELECT COUNT(*) as count FROM order_items WHERE menu_item_id = ?";
    $orderCheck = $dbService->query($orderCheckSql, [$id]);

    if ($orderCheck[0]['count'] > 0) {
        // Instead of deleting, mark as unavailable
        $sql = "UPDATE menu_items SET is_available = 0, updated_at = NOW() WHERE id = ?";
        $result = $dbService->query($sql, [$id]);

        if ($result !== false) {
            echo json_encode(['message' => 'Menu item marked as unavailable (has order history)']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update menu item']);
        }
    } else {
        $sql = "DELETE FROM menu_items WHERE id = ?";
        $result = $dbService->query($sql, [$id]);

        if ($result !== false) {
            echo json_encode(['message' => 'Menu item deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete menu item']);
        }
    }
}
?>