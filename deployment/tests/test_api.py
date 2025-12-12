import pytest
import asyncio
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from deployment.app import app

client = TestClient(app)

def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "models_loaded" in data

def test_models_status_endpoint():
    """Test the model status endpoint"""
    response = client.get("/models/status")
    assert response.status_code == 200
    data = response.json()
    assert "models_loaded" in data
    assert "models" in data

def test_prediction_endpoint_missing_models():
    """Test prediction endpoint when models are not loaded"""
    test_data = {
        "percentage_yield": 85.5,
        "gravity": 0.85,
        "vapour_pressure": 2.3,
        "ten_percent_distillation": 180.0,
        "fraction_end_point": 350.0,
        "actual_feed_mt": 100.5,
        "feed_ffa": 1.2,
        "moisture": 0.5,
        "bleaching_earth_quantity": 15.0,
        "phosphoric_acid_quantity": 2.5,
        "citric_acid_quantity": 1.8,
        "phenamol_quantity": 0.8,
        "fractionation_feed": 95.0,
        "phenomol_consumption": 0.6
    }
    
    response = client.post("/predict", json=test_data)
    # Should return 503 when models not loaded
    assert response.status_code == 503

def test_prediction_invalid_input():
    """Test prediction with invalid input data"""
    invalid_data = {
        "percentage_yield": 150,  # Invalid: > 100
        "gravity": 0.85,
        "vapour_pressure": 2.3,
        "ten_percent_distillation": 180.0,
        "fraction_end_point": 350.0,
        "actual_feed_mt": 100.5,
        "feed_ffa": 1.2,
        "moisture": 0.5,
        "bleaching_earth_quantity": 15.0,
        "phosphoric_acid_quantity": 2.5,
        "citric_acid_quantity": 1.8,
        "phenamol_quantity": 0.8,
        "fractionation_feed": 95.0,
        "phenomol_consumption": 0.6
    }
    
    response = client.post("/predict", json=invalid_data)
    # Should return 422 for validation error
    assert response.status_code == 422

def test_prediction_missing_fields():
    """Test prediction with missing required fields"""
    incomplete_data = {
        "percentage_yield": 85.5,
        "gravity": 0.85
        # Missing other required fields
    }
    
    response = client.post("/predict", json=incomplete_data)
    # Should return 422 for missing fields
    assert response.status_code == 422

def test_cors_headers():
    """Test CORS headers are present"""
    response = client.options("/health")
    assert response.status_code == 200
    # CORS headers should be present
    assert "access-control-allow-origin" in response.headers

if __name__ == "__main__":
    pytest.main([__file__])
