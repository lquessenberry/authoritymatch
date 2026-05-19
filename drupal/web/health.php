<?php
// Simple health check endpoint
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['status' => 'healthy', 'time' => time()]);
