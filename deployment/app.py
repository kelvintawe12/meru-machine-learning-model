import uvicorn
import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Refinery Loss Prediction API",
    description="API for predicting refinery loss percentage based on process parameters.",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model loading with proper error handling
class ModelManager:
    """Manages loading and validation of ML models"""
    
    def __init__(self):
        self.models = {}
        self.is_loaded = False
        
    def load_models(self, models_dir: str = "models") -> bool:
        """Load all required models with comprehensive error handling"""
        try:
            logger.info(f"Loading models from: {models_dir}")
            
            # Check if models directory exists
            if not os.path.exists(models_dir):
                logger.error(f"Models directory not found: {models_dir}")
                return False
            
            # Load each model with individual error handling
            model_files = {
                'best_model_real': 'best_real_loss_model.pkl',
                'scaler_real': 'real_scaler.pkl',
                'poly_real': 'poly_real.pkl',
                'selector_real': 'selector_real.pkl'
            }
            
            for model_name, filename in model_files.items():
                file_path = os.path.join(models_dir, filename)
                if not os.path.exists(file_path):
                    logger.error(f"Model file not found: {file_path}")
                    return False
                
                try:
                    self.models[model_name] = joblib.load(file_path)
                    logger.info(f"Successfully loaded {model_name}")
                except Exception as e:
                    logger.error(f"Failed to load {model_name}: {str(e)}")
                    return False
            
            self.is_loaded = True
            logger.info("All models loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Critical error during model loading: {str(e)}")
            return False
    
    def get_model(self, name: str):
        """Get a loaded model by name"""
        if not self.is_loaded:
            raise ValueError("Models not loaded yet")
        return self.models.get(name)
    
    def is_ready(self) -> bool:
        """Check if all models are loaded"""
        return self.is_loaded

# Initialize model manager
model_manager = ModelManager()

# Base feature names (must match training data)
BASE_FEATURE_NAMES = [
    'percentage_yield', 'gravity', 'vapour_pressure', 'ten_percent_distillation',
    'fraction_end_point', 'actual_feed_mt', 'feed_ffa', 'moisture',
    'bleaching_earth_quantity', 'phosphoric_acid_quantity', 'citric_acid_quantity',
    'phenamol_quantity', 'fractionation_feed', 'phenomol_consumption'
]

# Model input validation with realistic constraints
class PredictionInput(BaseModel):
    percentage_yield: float = Field(..., ge=0, le=100, description="Percentage yield (0-100)")
    gravity: float = Field(..., ge=0, le=2, description="Gravity value")
    vapour_pressure: float = Field(..., ge=0, description="Vapour pressure")
    ten_percent_distillation: float = Field(..., ge=0, description="10% distillation temperature")
    fraction_end_point: float = Field(..., ge=0, description="Fraction end point")
    actual_feed_mt: float = Field(..., ge=0, description="Actual feed in metric tons")
    feed_ffa: float = Field(..., ge=0, le=50, description="Feed FFA percentage (0-50)")
    moisture: float = Field(..., ge=0, le=10, description="Moisture percentage (0-10)")
    bleaching_earth_quantity: float = Field(..., ge=0, description="Bleaching earth quantity")
    phosphoric_acid_quantity: float = Field(..., ge=0, description="Phosphoric acid quantity")
    citric_acid_quantity: float = Field(..., ge=0, description="Citric acid quantity")
    phenamol_quantity: float = Field(..., ge=0, description="Phenol quantity")
    fractionation_feed: float = Field(..., ge=0, description="Fractionation feed")
    phenomol_consumption: float = Field(..., ge=0, description="Phenol consumption")

# Response model
class PredictionResponse(BaseModel):
    prediction: float
    confidence_level: str
    processing_time_ms: float
    timestamp: str

@app.on_event("startup")
async def startup_event():
    """Load models on application startup"""
    logger.info("Starting Refinery Loss Prediction API...")
    
    # Determine models directory based on environment
    models_dir = os.getenv("MODELS_DIR", "models")
    logger.info(f"Looking for models in: {models_dir}")
    
    # Try to load models
    if not model_manager.load_models(models_dir):
        logger.error("Failed to load models. API will not function properly.")
    else:
        logger.info("API startup completed successfully")

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    status = {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": model_manager.is_ready(),
        "api_version": "2.0.0"
    }
    
    if model_manager.is_ready():
        status["details"] = "All systems operational"
    else:
        status["details"] = "Models not loaded - API may not function"
        status["status"] = "degraded"
    
    return status

@app.get("/models/status")
async def models_status():
    """Get detailed model loading status"""
    return {
        "models_loaded": model_manager.is_ready(),
        "models": {
            "best_model_real": model_manager.get_model('best_model_real') is not None,
            "scaler_real": model_manager.get_model('scaler_real') is not None,
            "poly_real": model_manager.get_model('poly_real') is not None,
            "selector_real": model_manager.get_model('selector_real') is not None
        }
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_loss(data: PredictionInput):
    """Predict refinery loss with enhanced error handling"""
    start_time = datetime.now()
    
    try:
        # Check if models are loaded
        if not model_manager.is_ready():
            raise HTTPException(
                status_code=503, 
                detail="Models not loaded. Please check server status."
            )
        
        # Convert input to DataFrame
        input_df = pd.DataFrame([data.dict()])
        input_df = input_df[BASE_FEATURE_NAMES]
        
        # Validate input data
        if input_df.isnull().any().any():
            raise HTTPException(status_code=400, detail="Input contains null values")
        
        # Get models
        best_model = model_manager.get_model('best_model_real')
        scaler = model_manager.get_model('scaler_real')
        poly = model_manager.get_model('poly_real')
        selector = model_manager.get_model('selector_real')
        
        if not all([best_model, scaler, poly, selector]):
            raise HTTPException(status_code=503, detail="Required models not available")
        
        # Apply transformations
        input_poly = poly.transform(input_df)
        full_poly_feature_names = poly.get_feature_names_out(BASE_FEATURE_NAMES)
        input_poly_df = pd.DataFrame(input_poly, columns=full_poly_feature_names)
        
        # Select features
        input_selected = selector.transform(input_poly_df)
        
        # Scale features
        input_scaled = scaler.transform(input_selected)
        
        # Make prediction
        prediction = best_model.predict(input_scaled)[0]
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Determine confidence level
        confidence = "high" if abs(prediction) < 10 else "medium" if abs(prediction) < 20 else "low"
        
        logger.info(f"Prediction completed: {prediction:.4f} (confidence: {confidence})")
        
        return PredictionResponse(
            prediction=float(prediction),
            confidence_level=confidence,
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/docs")
async def get_docs():
    """Redirect to API documentation"""
    return {"message": "API documentation available at /docs"}

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        "app:app", 
        host=host, 
        port=port, 
        reload=reload,
        log_level="info"
    )
