<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

// Simple in-memory "database"
$data = [
    ['id' => 1, 'name' => 'Item 1'],
    ['id' => 2, 'name' => 'Item 2']
];

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

// Process the request
switch ($method) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGetRequest() {
    global $data;
    
    // Get specific item if ID is provided
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $item = array_filter($data, function($item) use ($id) {
            return $item['id'] == $id;
        });
        
        if (!empty($item)) {
            echo json_encode(array_values($item)[0]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Item not found']);
        }
    } else {
        // Return all items
        echo json_encode($data);
    }
}

function handlePostRequest() {
    global $data;
    
    // Get the input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!empty($input['name'])) {
        // Create new item
        $newItem = [
            'id' => count($data) + 1,
            'name' => $input['name']
        ];
        
        array_push($data, $newItem);
        http_response_code(201); // Created
        echo json_encode($newItem);
    } else {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Name is required']);
    }
}
?>