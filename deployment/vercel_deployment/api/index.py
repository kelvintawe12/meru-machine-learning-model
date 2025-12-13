def handler(event, context):
    """Ultra-minimal serverless handler"""
    
    # Extract path from event
    path = event.get('path', '/')
    method = event.get('method', 'GET')
    
    # Handle different endpoints
    if path == '/' or path == '/health':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': '{"status": "ok", "message": "Mount Meru Refinery ML API", "version": "3.0.0", "platform": "vercel"}'
        }
    
    elif path == '/predict' and method == 'POST':
        # Simple prediction logic
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': '{"loss_percentage": 2.0, "yield_percentage": 98.0, "confidence_level": "medium", "timestamp": "2024-12-13T03:45:00.000Z", "request_id": "test123"}'
        }
    
    elif path == '/docs':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': '{"title": "Mount Meru Refinery ML API", "endpoints": {"GET /": "API info", "GET /health": "Health check", "POST /predict": "Make prediction"}}'
        }
    
    # Default response
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json'},
        'body': '{"error": "Not found", "available_endpoints": ["/", "/health", "/predict", "/docs"]}'
    }
