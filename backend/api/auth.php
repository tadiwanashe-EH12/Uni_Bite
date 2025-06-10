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
    case 'POST':
        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'register':
                handleRegister($dbService);
                break;
            case 'login':
                handleLogin($dbService);
                break;
            case 'validate':
                handleValidateToken();
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}


$dbService->close();

function handleRegister($dbService) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }

    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }

    if (strlen($input['password']) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters']);
        return;
    }

    // Check if email exists
    $sql = "SELECT id FROM users WHERE email = ?";
    $result = $dbService->query($sql, [$input['email']]);
    
    if (!empty($result)) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        return;
    }

    // Hash password
    $hashedPassword = password_hash($input['password'], PASSWORD_ALGO, PASSWORD_OPTIONS);

    // Create user
    $sql = "INSERT INTO users (email, password_hash) VALUES (?, ?)";
    $result = $dbService->query($sql, [$input['email'], $hashedPassword]);
    
    if ($result > 0) {
        $userId = $dbService->query("SELECT LAST_INSERT_ID() as id")[0]['id'];
        http_response_code(201);
        echo json_encode(['message' => 'Registration successful', 'user_id' => $userId]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed']);
    }
}

function handleLogin($dbService) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (empty($input['email']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }

    // Get user
    $sql = "SELECT id, password_hash FROM users WHERE email = ?";
    $result = $dbService->query($sql, [$input['email']]);
    
    if (empty($result)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        return;
    }

    $user = $result[0];

    // Verify password_hash
    if (!password_verify($input['password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        return;
    }

    // Generate token
    $token = JWTService::generateToken($user['id']);

    // Return success with token
    $sql = "SELECT * FROM users WHERE id = ?";
    $account= $dbService->query($sql, [$user['id']]);

    echo json_encode([
        'message' => 'Login successful',
        'token' => $token,
        'user' => $account[0],
        'expires_in' => JWT_EXPIRE
    ]);
}

function handleValidateToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token not provided']);
        return;
    }

    $token = $matches[1];
    $payload = JWTService::validateToken($token);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        return;
    }

    echo json_encode([
        'valid' => true,
        'user_id' => $payload['user_id'],
        'expires_at' => $payload['exp']
    ]);
}
?>

