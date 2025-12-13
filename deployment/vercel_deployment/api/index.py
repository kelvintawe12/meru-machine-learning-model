import json
from datetime import datetime
import uuid

def handler(event, context):
    """Minimal serverless handler for Mount Meru Refinery API"""
    
    # Set up CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
    # Handle preflight requests
    if event.get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Extract path and method from event
    path = event.get('path', '/')
    method = event.get('method', 'GET')
    
    # Handle different endpoints
    if path == '/' or path == '/health':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                "status": "ok",
                "message": "Mount Meru Refinery ML API - Minimal Version",
                "version": "3.0.0-minimal",
                "platform": "vercel",
                "note": "Full ML version requires dedicated hosting due to model size",
                "timestamp": datetime.now().isoformat()
            })
        }
    
    elif path == '/docs':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                "title": "Mount Meru Refinery ML API - Minimal Version",
                "version": "3.0.0-minimal",
                "description": "Serverless ML predictions for refinery operations (minimal version)",
                "note": "This is a minimal version. Full ML capabilities require dedicated hosting.",
                "endpoints": {
                    "GET /": "API information and health check",
                    "GET /health": "Health check with system status",
                    "POST /predict": "Demo prediction endpoint (returns simulated data)",
                    "GET /docs": "API documentation"
                },
                "demo_prediction_example": {
                    "loss_percentage": 2.5,
                    "yield_percentage": 97.5,
                    "confidence_level": "medium",
                    "processing_time_ms": 45.2,
                    "timestamp": "2024-12-13T09:28:00.000Z",
                    "request_id": "demo123"
                },
                "full_deployment_guide": {
                    "note": "For full ML capabilities, deploy using Docker on platforms like Railway, Render, or AWS",
                    "docker_image_size": "~500MB",
                    "recommended_platforms": ["Railway", "Render", "AWS Lambda", "Google Cloud Run"]
                }
            })
        }
    
    elif path == '/predict' and method == 'POST':
        # Demo prediction endpoint - returns simulated realistic data
        try:
            # Parse request body (not used for demo)
            body = event.get('body', '{}')
            
            # Generate realistic demo prediction
            import random
            loss_percentage = round(random.uniform(0.8, 4.2), 2)
            yield_percentage = round(100 - loss_percentage, 2)
            
            confidence_levels = ["high", "medium", "low"]
            confidence = random.choices(confidence_levels, weights=[0.6, 0.3, 0.1])[0]
            
            processing_time = round(random.uniform(20, 80), 2)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    "loss_percentage": loss_percentage,
                    "yield_percentage": yield_percentage,
                    "confidence_level": confidence,
                    "processing_time_ms": processing_time,
                    "timestamp": datetime.now().isoformat(),
                    "request_id": str(uuid.uuid4()),
                    "note": "Demo prediction - actual ML model requires dedicated hosting",
                    "model_info": {
                        "version": "3.0.0-minimal",
                        "type": "simulated",
                        "features": 14,
                        "accuracy": "simulated"
                    }
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({
                    "error": f"Demo prediction failed: {str(e)}",
                    "note": "This is a demo endpoint. Full ML model deployment required for actual predictions."
                })
            }
    
    # Default response for unknown endpoints
    return {
        'statusCode': 404,
        'headers': headers,
        'body': json.dumps({
            "error": "Not found",
            "message": f"Endpoint {path} not found",
            "available_endpoints": [
                "/",
                "/health", 
                "/predict",
                "/docs"
            ],
            "method_used": method,
            "note": "This is a minimal version. Full ML capabilities require dedicated hosting."
        })
    }
