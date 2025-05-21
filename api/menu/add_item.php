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
$requiredFields = ['name', 'description', 'price', 'category_id'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "$field is required"]);
        exit;
    }
}

// Handle image upload
$imageUrl = '';
if (!empty($_FILES['image'])) {
    $targetDir = __DIR__ . "/../../images/menu/";
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0777, true);
    }
    
    $fileExt = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $fileName = uniqid() . '.' . $fileExt;
    $targetFile = $targetDir . $fileName;
    
    // Validate image
    $check = getimagesize($_FILES['image']['tmp_name']);
    if ($check === false) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'File is not an image']);
        exit;
    }
    
    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
        $imageUrl = "/images/menu/" . $fileName;
    }
}

$conn = getDBConnection();
$stmt = $conn->prepare("
    INSERT INTO menu_items 
    (name, description, price, category_id, image_url, is_available) 
    VALUES (?, ?, ?, ?, ?, 1)
");
$stmt->bind_param(
    "ssdis", 
    $data['name'],
    $data['description'],
    $data['price'],
    $data['category_id'],
    $imageUrl
);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Menu item added',
        'item_id' => $conn->insert_id,
        'image_url' => $imageUrl
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to add menu item']);
}

$stmt->close();
$conn->close();
?>