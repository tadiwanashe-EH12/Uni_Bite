<?php
header('Content-Type: application/json');

$docs = [
    'authentication' => [
        'POST /auth/register' => [
            'description' => 'Register a new user',
            'parameters' => ['name', 'email', 'password', 'role?'],
            'response' => ['status', 'token', 'user']
        ],
        'POST /auth/login' => [
            'description' => 'Login user',
            'parameters' => ['email', 'password'],
            'response' => ['status', 'token', 'user']
        ]
    ],
    'menu' => [
        'GET /menu/get_menu' => [
            'description' => 'Get available menu items by category',
            'response' => ['status', 'data' => ['category' => ['items']]]
        ],
        'POST /menu/add_item' => [
            'description' => 'Add new menu item (Admin only)',
            'parameters' => ['name', 'description', 'price', 'category_id', 'image?'],
            'response' => ['status', 'item_id', 'image_url']
        ]
    ],
    // Add documentation for all other endpoints
];

echo json_encode($docs, JSON_PRETTY_PRINT);
?>