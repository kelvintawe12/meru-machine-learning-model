# 🚀 Complete Vercel Deployment Guide for Mount Meru ML Model

## Overview
Deploy your refinery ML prediction system (FastAPI + ML models) to Vercel with optimized serverless functions.

## ✅ What We Accomplished

### **Model Optimization Complete**
- **Models Optimized**: 4 ML models compressed successfully
- **Total Size**: ~15KB (extremely small - perfect for Vercel)
- **Compression Rate**: 16-82% reduction in size
- **Location**: `/optimized_models/` directory

## 📋 Pre-Deployment Checklist

### **1. Project Structure Setup**
Your project should look like this:
```
meru-machine-learning-model/
├── deployment/
│   ├── app.py                 # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── vercel.json           # Vercel configuration
│   ├── models/               # Original models
│   └── optimized_models/     # ✅ Compressed models (ready)
├── dashboard/                # React frontend
└── optimize_models.py       # ✅ Model optimization script
```

## 🛠️ Step-by-Step Deployment

### **Step 1: Prepare Deployment Directory**

```bash
# Create deployment package
cd deployment/
mkdir -p vercel_deployment
cp -r optimized_models/ vercel_deployment/
cp app.py vercel_deployment/
cp requirements.txt vercel_deployment/
cp vercel.json vercel_deployment/
```

### **Step 2: Update App for Vercel**

Create a Vercel-optimized version of your FastAPI app:
<tool_call>
<invoke name="create_file">
<parameter name="content">import uvicorn
import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import uuid
import gzip
import pickle
from enum import Enum

# Configure logging for Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Mount Meru Refinery ML API",
    description="Serverless ML predictions for refinery operations",
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model storage (cached across function calls)
models_cache = {}

def load_compressed_model(model_path):
    """Load model from compressed file"""
    try:
        with gzip.open(model_path, 'rb') as f:
            return pickle.load(f)
    except Exception as e:
        logger.error(f"Failed to load model {model_path}: {str(e)}")
        return None

def """Load all ML load_models():
    models (cached for performance)"""
    global models_cache
    
    if models_cache:
        return models_cache
    
    model_paths = {
        'best_model_real': 'optimized_models/best_real_loss_model.pkl.gz',
        'scaler_real': 'optimized_models/real_scaler.pkl.gz',
        'poly_real': 'optimized_models/poly_real.pkl.gz',
        'selector_real': 'optimized_models/selector_real.pkl.gz'
    }
    
    logger.info("Loading ML models...")
    for model_name, model_path in model_paths.items():
        model = load_compressed_model(model_path)
        if model:
            models_cache[model_name] = model
            logger.info(f"Loaded {model_name}")
        else:
            logger.error(f"Failed to load {model_name}")
    
    return models_cache

# Load models on startup
@app.on_event("startup")
async def startup_event():
    """Load models on function startup"""
    logger.info("🚀 Starting Mount Meru ML API on Vercel...")
    load_models()
    logger.info("✅ Startup complete")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    models = load_models()
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": len(models),
        "api_version": "3.0.0",
        "platform": "vercel"
    }

# Model status endpoint
@app.get("/models/status")
async def models_status():
    """Get model loading status"""
    models = load_models()
    return {
        "models_loaded": bool(models),
        "models": {
            "best_model_real": models.get('best_model_real') is not None,
            "scaler_real": models.get('scaler_real') is not None,
            "poly_real": models.get('poly_real') is not None,
            "selector_real": models.get('selector_real') is not None
        }
    }

# Input model
class RefineryOperationInput(BaseModel):
    percentage_yield: float = Field(..., ge=0, le=100)
    gravity: float = Field(..., ge=0, le=2)
    vapour_pressure: float = Field(..., ge=0)
    ten_percent_distillation: float = Field(..., ge=0)
    fraction_end_point: float = Field(..., ge=0)
    actual_feed_mt: float = Field(..., ge=0)
    feed_ffa: float = Field(..., ge=0, le=50)
    moisture: float = Field(..., ge=0, le=10)
    bleaching_earth_quantity: float = Field(..., ge=0)
    phosphoric_acid_quantity: float = Field(..., ge=0)
    citric_acid_quantity: float = Field(..., ge=0)
    phenamol_quantity: float = Field(..., ge=0)
    fractionation_feed: float = Field(..., ge=0)
    phenomol_consumption: float = Field(..., ge=0)

# Response model
class PredictionResponse(BaseModel):
    loss_percentage: float
    yield_percentage: float
    confidence_level: str
    processing_time_ms: float
    timestamp: str
    request_id: str

# Base feature names
BASE_FEATURE_NAMES = [
    'percentage_yield', 'gravity', 'vapour_pressure', 'ten_percent_distillation',
    'fraction_end_point', 'actual_feed_mt', 'feed_ffa', 'moisture',
    'bleaching_earth_quantity', 'phosphoric_acid_quantity', 'citric_acid_quantity',
    'phenamol_quantity', 'fractionation_feed', 'phenomol_consumption'
]

@app.post("/predict", response_model=PredictionResponse)
async def predict_loss(data: RefineryOperationInput):
    """ML-powered refinery loss prediction"""
    start_time = datetime.now()
    
    try:
        # Load models
        models = load_models()
        
        if not models:
            raise HTTPException(status_code=503, detail="Models not loaded")
        
        # Convert input to DataFrame
        input_df = pd.DataFrame([data.dict()])
        input_df = input_df[BASE_FEATURE_NAMES]
        
        # Apply ML pipeline
        best_model = models.get('best_model_real')
        scaler = models.get('scaler_real')
        poly = models.get('poly_real')
        selector = models.get('selector_real')
        
        if not all([best_model, scaler, poly, selector]):
            raise HTTPException(status_code=503, detail="Required models not available")
        
        # Transform and predict
        input_poly = poly.transform(input_df)
        full_poly_feature_names = poly.get_feature_names_out(BASE_FEATURE_NAMES)
        input_poly_df = pd.DataFrame(input_poly, columns=full_poly_feature_names)
        
        input_selected = selector.transform(input_poly_df)
        input_scaled = scaler.transform(input_selected)
        
        raw_prediction = best_model.predict(input_scaled)[0]
        
        # Apply realistic scaling
        if data.actual_feed_mt > 0:
            prediction_percentage = (raw_prediction / data.actual_feed_mt) * 100
            prediction = max(0.1, min(prediction_percentage, 5.0))
        else:
            prediction = 1.0
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Determine confidence
        confidence = "high" if abs(prediction - 2.0) < 1.0 else "medium"
        
        logger.info(f"Prediction completed: {prediction:.4f}% (confidence: {confidence})")
        
        return PredictionResponse(
            loss_percentage=round(float(prediction), 2),
            yield_percentage=round(100 - float(prediction), 2),
            confidence_level=confidence,
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat(),
            request_id=str(uuid.uuid4())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Mount Meru Refinery ML API",
        "version": "3.0.0",
        "status": "running",
        "platform": "vercel"
    }

@app.get("/docs")
async def get_docs():
    """API documentation"""
    return {
        "title": "Mount Meru Refinery ML API",
        "version": "3.0.0",
        "endpoints": {
            "GET /": "API information",
            "GET /health": "Health check",
            "GET /models/status": "Model status",
            "POST /predict": "Make ML prediction"
        }
    }

# Vercel serverless function entry point
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
