<?php
// menu/get_menu.php
require_once __DIR__ . '/../../db_config.php';

header('Content-Type: application/json');

$conn = getDBConnection();

// Get all available menu items with their categories
$query = "SELECT 
            mi.id, 
            mi.name, 
            mi.description, 
            mi.price, 
            mi.image_url, 
            mi.is_available,
            mc.name AS category_name
          FROM menu_items mi
          JOIN menu_categories mc ON mi.category_id = mc.id
          WHERE mi.is_available = 1
          ORDER BY mc.display_order, mi.name";

$result = $conn->query($query);

if (!$result) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
    exit;
}

$menu = [];
while ($row = $result->fetch_assoc()) {
    $category = $row['category_name'];
    if (!isset($menu[$category])) {
        $menu[$category] = [];
    }
    unset($row['category_name']);
    $menu[$category][] = $row;
}

echo json_encode([
    'status' => 'success',
    'data' => $menu
]);

$conn->close();
?>