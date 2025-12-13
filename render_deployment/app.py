

import uvicorn
import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import uuid
import asyncio
from enum import Enum
import gzip
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Initialize FastAPI app
app = FastAPI(
    title="Enhanced Refinery Operations API",
    description="Comprehensive API for refinery operations including loss prediction, yield analysis, and process optimization.",
    version="3.0.0"
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
                'best_model_real': 'best_real_loss_model.pkl.gz',
                'scaler_real': 'real_scaler.pkl.gz',
                'poly_real': 'poly_real.pkl.gz',
                'selector_real': 'selector_real.pkl.gz'
            }
            
            for model_name, filename in model_files.items():
                file_path = os.path.join(models_dir, filename)
                if not os.path.exists(file_path):
                    logger.error(f"Model file not found: {file_path}")
                    return False
                


                try:
                    # Load model files (joblib handles .pkl.gz compression automatically)
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


# Enums for better type safety
class ProcessType(str, Enum):
    REFINERY = "refinery"
    FRACTIONATION = "fractionation"
    CHEMICAL_TREATMENT = "chemical_treatment"

class AnalysisType(str, Enum):
    BASIC = "basic"
    DETAILED = "detailed"
    COMPARATIVE = "comparative"

class QualityLevel(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

# Enhanced model input validation

class RefineryOperationInput(BaseModel):
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
    process_type: ProcessType = Field(default=ProcessType.REFINERY, description="Type of refinery operation")
    convert_to_percentage: bool = Field(default=True, description="Convert prediction from metric tons to percentage of feed")

class BatchPredictionRequest(BaseModel):
    requests: List[RefineryOperationInput] = Field(..., max_items=100, description="Batch of prediction requests")
    analysis_type: AnalysisType = Field(default=AnalysisType.BASIC, description="Type of batch analysis")


class OptimizationRequest(BaseModel):
    current_operation: RefineryOperationInput
    target_loss_percentage: Optional[float] = Field(None, ge=0, le=100, description="Target loss percentage")
    optimization_priority: str = Field(default="cost_efficiency", pattern="^(cost_efficiency|quality_maximization|yield_optimization)$")

class QualityAnalysisRequest(BaseModel):
    operation: RefineryOperationInput
    quality_standards: Dict[str, float] = Field(default_factory=dict, description="Quality standard thresholds")

# Enhanced response models
class LossBreakdown(BaseModel):
    total_loss_percentage: float
    raw_material_loss: float = Field(..., ge=0, le=100)
    energy_loss: float = Field(..., ge=0, le=100)
    process_loss: float = Field(..., ge=0, le=100)
    waste_loss: float = Field(..., ge=0, le=100)
    efficiency_loss: float = Field(..., ge=0, le=100)

class YieldAnalysis(BaseModel):
    overall_yield_percentage: float
    theoretical_maximum_yield: float
    actual_yield_percentage: float
    yield_efficiency: float
    process_efficiency: float
    quality_score: float

class ProcessMetrics(BaseModel):
    total_processing_time_hours: float
    energy_efficiency_percentage: float
    chemical_efficiency_percentage: float
    equipment_utilization_percentage: float
    waste_generation_percentage: float
    cost_per_unit: float

class OptimizationSuggestion(BaseModel):
    parameter: str
    current_value: float
    suggested_value: float
    expected_improvement_percentage: float
    confidence_level: str
    implementation_difficulty: str

class EnhancedPredictionResponse(BaseModel):
    # Core prediction data
    loss_percentage: float
    yield_percentage: float
    confidence_level: str
    
    # Detailed analysis
    loss_breakdown: LossBreakdown
    yield_analysis: YieldAnalysis
    process_metrics: ProcessMetrics
    
    # Metadata
    processing_time_ms: float
    timestamp: str
    request_id: str
    model_version: str

class BatchPredictionResponse(BaseModel):
    batch_id: str
    total_predictions: int
    predictions: List[EnhancedPredictionResponse]
    batch_statistics: Dict[str, Any]
    processing_time_ms: float
    timestamp: str

class OptimizationResponse(BaseModel):
    current_loss_percentage: float
    potential_loss_reduction: float
    optimization_score: float
    suggestions: List[OptimizationSuggestion]
    expected_roi_percentage: float
    implementation_timeline_days: int
    processing_time_ms: float
    timestamp: str

class QualityAnalysisResponse(BaseModel):
    overall_quality_score: float
    quality_level: QualityLevel
    compliance_percentage: float
    quality_breakdown: Dict[str, float]
    recommendations: List[str]
    improvement_potential: float
    processing_time_ms: float
    timestamp: str

# Initialize model manager
model_manager = ModelManager()


# Base feature names (must match training data)
BASE_FEATURE_NAMES = [
    'percentage_yield', 'gravity', 'vapour_pressure', 'ten_percent_distillation',
    'fraction_end_point', 'actual_feed_mt', 'feed_ffa', 'moisture',
    'bleaching_earth_quantity', 'phosphoric_acid_quantity', 'citric_acid_quantity',
    'phenamol_quantity', 'fractionation_feed', 'phenomol_consumption'
]

# Legacy input model for backward compatibility
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

# Legacy response model for backward compatibility
class PredictionResponse(BaseModel):
    prediction: float
    confidence_level: str
    processing_time_ms: float
    timestamp: str

# Utility functions for percentage calculations

def calculate_loss_breakdown(prediction: float, operation: RefineryOperationInput) -> LossBreakdown:
    """Calculate detailed loss breakdown based on prediction and operation parameters"""
    
    # Ensure total loss is within realistic bounds
    total_loss = max(0.1, min(prediction, 5.0))  # Keep between 0.1% and 5%
    
    # Base distribution weights for refinery losses (should sum to 1.0)
    base_weights = {
        'raw_material': 0.30,  # 30% of total loss
        'energy': 0.20,        # 20% of total loss
        'process': 0.25,       # 25% of total loss
        'waste': 0.15,         # 15% of total loss
        'efficiency': 0.10     # 10% of total loss
    }
    
    # Apply realistic modifiers based on operation parameters (bounded)
    # Higher FFA increases raw material losses
    raw_material_modifier = 1.0 + (operation.feed_ffa / 10.0)  # Max 2x at 10% FFA
    raw_material_modifier = min(raw_material_modifier, 2.0)    # Cap at 2x
    
    # Higher vapour pressure increases energy losses
    energy_modifier = 1.0 + (operation.vapour_pressure / 5.0)  # Max 2x at 5.0 pressure
    energy_modifier = min(energy_modifier, 2.0)                # Cap at 2x
    
    # Higher moisture increases process losses
    process_modifier = 1.0 + (operation.moisture / 0.2)       # Max 2x at 0.2 moisture
    process_modifier = min(process_modifier, 2.0)              # Cap at 2x
    
    # Larger feed size slightly increases waste losses
    waste_modifier = 1.0 + (operation.actual_feed_mt / 1000.0)  # Max 1.5x at 1000 MT
    waste_modifier = min(waste_modifier, 1.5)                  # Cap at 1.5x
    
    # Efficiency losses are relatively constant
    efficiency_modifier = 1.0
    
    # Calculate weighted contributions ensuring they sum to total_loss
    total_modifier = (
        base_weights['raw_material'] * raw_material_modifier +
        base_weights['energy'] * energy_modifier +
        base_weights['process'] * process_modifier +
        base_weights['waste'] * waste_modifier +
        base_weights['efficiency'] * efficiency_modifier
    )
    
    # Calculate individual loss components (ensuring they don't exceed reasonable bounds)
    raw_material_loss = (total_loss * base_weights['raw_material'] * raw_material_modifier) / total_modifier
    energy_loss = (total_loss * base_weights['energy'] * energy_modifier) / total_modifier
    process_loss = (total_loss * base_weights['process'] * process_modifier) / total_modifier
    waste_loss = (total_loss * base_weights['waste'] * waste_modifier) / total_modifier
    efficiency_loss = (total_loss * base_weights['efficiency'] * efficiency_modifier) / total_modifier
    
    # Ensure no single loss component exceeds 3% (very conservative for well-operated refinery)
    max_individual_loss = min(total_loss * 0.6, 3.0)  # No single component > 60% of total or 3%
    
    raw_material_loss = min(raw_material_loss, max_individual_loss)
    energy_loss = min(energy_loss, max_individual_loss)
    process_loss = min(process_loss, max_individual_loss)
    waste_loss = min(waste_loss, max_individual_loss)
    efficiency_loss = min(efficiency_loss, max_individual_loss)
    
    # Renormalize to ensure sum equals total_loss
    current_sum = raw_material_loss + energy_loss + process_loss + waste_loss + efficiency_loss
    if current_sum > 0:
        scale_factor = total_loss / current_sum
        raw_material_loss *= scale_factor
        energy_loss *= scale_factor
        process_loss *= scale_factor
        waste_loss *= scale_factor
        efficiency_loss *= scale_factor
    
    return LossBreakdown(
        total_loss_percentage=round(total_loss, 2),
        raw_material_loss=round(raw_material_loss, 2),
        energy_loss=round(energy_loss, 2),
        process_loss=round(process_loss, 2),
        waste_loss=round(waste_loss, 2),
        efficiency_loss=round(efficiency_loss, 2)
    )

def calculate_yield_analysis(prediction: float, operation: RefineryOperationInput) -> YieldAnalysis:
    """Calculate comprehensive yield analysis"""
    
    overall_yield = 100.0 - max(0, prediction)
    theoretical_maximum = 98.0  # Realistic theoretical maximum
    actual_yield = overall_yield
    yield_efficiency = (actual_yield / theoretical_maximum) * 100
    process_efficiency = operation.percentage_yield
    quality_score = min(100, (actual_yield + process_efficiency) / 2)
    
    return YieldAnalysis(
        overall_yield_percentage=round(overall_yield, 2),
        theoretical_maximum_yield=theoretical_maximum,
        actual_yield_percentage=round(actual_yield, 2),
        yield_efficiency=round(yield_efficiency, 2),
        process_efficiency=round(process_efficiency, 2),
        quality_score=round(quality_score, 2)
    )


def calculate_process_metrics(operation: RefineryOperationInput, prediction: float) -> ProcessMetrics:
    """Calculate process efficiency metrics"""
    
    # Calculate processing time based on feed size (simplified)
    total_processing_time = operation.actual_feed_mt / 50.0  # 50 MT per hour baseline
    
    # Calculate efficiencies based on operation parameters
    energy_eff = max(60, 100 - (operation.vapour_pressure * 2))
    chemical_eff = max(70, 100 - ((operation.bleaching_earth_quantity + operation.phosphoric_acid_quantity) / 100))
    equipment_util = min(95, 80 + (operation.percentage_yield / 5))
    waste_gen = max(0, (operation.moisture * 2) + (operation.feed_ffa * 0.5))
    cost_per_unit = operation.actual_feed_mt * (1 + (prediction / 100)) / 1000  # Simplified cost calculation
    
    return ProcessMetrics(
        total_processing_time_hours=round(total_processing_time, 2),
        energy_efficiency_percentage=round(energy_eff, 2),
        chemical_efficiency_percentage=round(chemical_eff, 2),
        equipment_utilization_percentage=round(equipment_util, 2),
        waste_generation_percentage=round(waste_gen, 2),
        cost_per_unit=round(cost_per_unit, 2)
    )

def enhance_prediction(data: RefineryOperationInput) -> EnhancedPredictionResponse:
    """Enhanced prediction with comprehensive analysis"""
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
        raw_prediction = best_model.predict(input_scaled)[0]
        
        # Apply realistic scaling for refinery operations
        # Typical refinery losses should be 0.1% to 5% of feed
        if data.convert_to_percentage:
            feed_amount = data.actual_feed_mt
            if feed_amount > 0:
                # Convert metric tons to percentage with realistic bounds
                prediction_percentage = (raw_prediction / feed_amount) * 100
                # Apply realistic bounds for refinery losses (0.1% to 5%)
                prediction = max(0.1, min(prediction_percentage, 5.0))
            else:
                prediction = 1.0  # Default to 1% if no feed amount
        else:
            # For metric tons, ensure realistic values
            prediction = max(0.01, min(raw_prediction, feed_amount * 0.05)) if feed_amount > 0 else 0.1
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Determine confidence based on prediction quality and model uncertainty
        # For refinery operations, low uncertainty means predictable, stable processes
        confidence_factors = [
            abs(prediction - 2.0) < 1.0,  # Close to typical 2% loss
            data.feed_ffa < 3.0,          # Good feed quality
            data.moisture < 0.3,          # Low moisture
            data.percentage_yield > 80,   # Good yield
            feed_amount > 50               # Reasonable feed size
        ]
        
        confidence_score = sum(confidence_factors) / len(confidence_factors)
        
        if confidence_score >= 0.8:
            confidence = "high"
        elif confidence_score >= 0.6:
            confidence = "medium"
        else:
            confidence = "low"
        
        # Calculate comprehensive analysis
        loss_breakdown = calculate_loss_breakdown(prediction, data)
        yield_analysis = calculate_yield_analysis(prediction, data)
        process_metrics = calculate_process_metrics(data, prediction)
        
        logger.info(f"Enhanced prediction completed: {prediction:.4f}% (confidence: {confidence})")
        
        return EnhancedPredictionResponse(
            loss_percentage=round(float(prediction), 2),
            yield_percentage=round(100 - float(prediction), 2),
            confidence_level=confidence,
            loss_breakdown=loss_breakdown,
            yield_analysis=yield_analysis,
            process_metrics=process_metrics,
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat(),
            request_id=str(uuid.uuid4()),
            model_version="3.0.0"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enhanced prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced prediction failed: {str(e)}")



@app.on_event("startup")
async def startup_event():
    """Load models on application startup"""
    logger.info("Starting Enhanced Refinery Operations API...")
    
    # Determine models directory based on environment
    models_dir = os.getenv("MODEL_PATH", "optimized_models")
    logger.info(f"Looking for models in: {models_dir}")
    
    # Try to load models
    if not model_manager.load_models(models_dir):
        logger.error("Failed to load models. API will not function properly.")
    else:
        logger.info("Enhanced API startup completed successfully")

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    status = {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": model_manager.is_ready(),
        "api_version": "3.0.0",
        "endpoints_available": [
            "/predict",
            "/batch/predict",
            "/analysis/yield",
            "/analysis/loss-breakdown",
            "/analysis/process-efficiency",
            "/optimize/parameters",
            "/analysis/quality"
        ]
    }
    
    if model_manager.is_ready():
        status["details"] = "All systems operational - Enhanced API ready"
    else:
        status["details"] = "Models not loaded - Enhanced API may not function"
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


# Core prediction endpoint
@app.post("/predict", response_model=EnhancedPredictionResponse)
async def predict_loss(data: RefineryOperationInput):
    """Enhanced refinery loss prediction with comprehensive analysis"""
    return enhance_prediction(data)

# Legacy prediction endpoint for backward compatibility
@app.post("/predict/legacy", response_model=PredictionResponse)
async def predict_loss_legacy(data: PredictionInput):
    """Legacy prediction endpoint for backward compatibility"""
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
        
        logger.info(f"Legacy prediction completed: {prediction:.4f} (confidence: {confidence})")
        
        return PredictionResponse(
            prediction=float(prediction),
            confidence_level=confidence,
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Legacy prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Legacy prediction failed: {str(e)}")

# Batch prediction endpoint
@app.post("/batch/predict", response_model=BatchPredictionResponse)
async def batch_predict(data: BatchPredictionRequest):
    """Process multiple predictions in batch"""
    start_time = datetime.now()
    batch_id = str(uuid.uuid4())
    
    try:
        predictions = []
        for operation in data.requests:
            prediction = enhance_prediction(operation)
            predictions.append(prediction)
        
        # Calculate batch statistics
        loss_percentages = [p.loss_percentage for p in predictions]
        yield_percentages = [p.yield_percentage for p in predictions]
        
        batch_statistics = {
            "average_loss_percentage": round(np.mean(loss_percentages), 2),
            "average_yield_percentage": round(np.mean(yield_percentages), 2),
            "min_loss_percentage": round(np.min(loss_percentages), 2),
            "max_loss_percentage": round(np.max(loss_percentages), 2),
            "loss_std_deviation": round(np.std(loss_percentages), 2),
            "predictions_above_threshold": len([l for l in loss_percentages if l > 5.0])
        }
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return BatchPredictionResponse(
            batch_id=batch_id,
            total_predictions=len(predictions),
            predictions=predictions,
            batch_statistics=batch_statistics,
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

# Yield analysis endpoint
@app.post("/analysis/yield")
async def analyze_yield(data: RefineryOperationInput):
    """Detailed yield analysis for refinery operations"""
    try:
        prediction = enhance_prediction(data)
        
        return {
            "operation_type": data.process_type.value,
            "yield_analysis": prediction.yield_analysis,
            "recommendations": [
                f"Current yield efficiency is {prediction.yield_analysis.yield_efficiency:.1f}%",
                "Consider optimizing process parameters to improve yield",
                f"Quality score of {prediction.yield_analysis.quality_score:.1f}% indicates {'good' if prediction.yield_analysis.quality_score > 80 else 'needs improvement'} performance"
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Yield analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Yield analysis failed: {str(e)}")

# Loss breakdown analysis endpoint
@app.post("/analysis/loss-breakdown")
async def analyze_loss_breakdown(data: RefineryOperationInput):
    """Detailed loss breakdown analysis"""
    try:
        prediction = enhance_prediction(data)
        
        return {
            "operation_type": data.process_type.value,
            "loss_breakdown": prediction.loss_breakdown,
            "primary_loss_sources": [
                {"source": "Raw Material Loss", "percentage": prediction.loss_breakdown.raw_material_loss},
                {"source": "Energy Loss", "percentage": prediction.loss_breakdown.energy_loss},
                {"source": "Process Loss", "percentage": prediction.loss_breakdown.process_loss},
                {"source": "Waste Loss", "percentage": prediction.loss_breakdown.waste_loss},
                {"source": "Efficiency Loss", "percentage": prediction.loss_breakdown.efficiency_loss}
            ],
            "improvement_opportunities": [
                "Optimize feed quality to reduce raw material losses",
                "Improve energy efficiency to reduce energy losses",
                "Enhance process controls to minimize process losses"
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Loss breakdown analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Loss breakdown analysis failed: {str(e)}")

# Process efficiency analysis endpoint
@app.post("/analysis/process-efficiency")
async def analyze_process_efficiency(data: RefineryOperationInput):
    """Comprehensive process efficiency analysis"""
    try:
        prediction = enhance_prediction(data)
        
        return {
            "operation_type": data.process_type.value,
            "process_metrics": prediction.process_metrics,
            "efficiency_scores": {
                "overall_efficiency": round((prediction.process_metrics.energy_efficiency_percentage + 
                                           prediction.process_metrics.chemical_efficiency_percentage + 
                                           prediction.process_metrics.equipment_utilization_percentage) / 3, 2),
                "energy_efficiency": prediction.process_metrics.energy_efficiency_percentage,
                "chemical_efficiency": prediction.process_metrics.chemical_efficiency_percentage,
                "equipment_utilization": prediction.process_metrics.equipment_utilization_percentage
            },
            "bottlenecks": [
                metric for metric, value in {
                    "Energy": prediction.process_metrics.energy_efficiency_percentage,
                    "Chemical": prediction.process_metrics.chemical_efficiency_percentage,
                    "Equipment": prediction.process_metrics.equipment_utilization_percentage
                }.items() if value < 80
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Process efficiency analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Process efficiency analysis failed: {str(e)}")

# Parameter optimization endpoint
@app.post("/optimize/parameters", response_model=OptimizationResponse)
async def optimize_parameters(data: OptimizationRequest):
    """Suggest optimal parameters to minimize losses"""
    start_time = datetime.now()
    
    try:
        current_prediction = enhance_prediction(data.current_operation)
        current_loss = current_prediction.loss_percentage
        
        # Generate optimization suggestions (simplified heuristic)
        suggestions = []
        
        # Suggest reducing FFA
        if data.current_operation.feed_ffa > 2.0:
            suggestions.append(OptimizationSuggestion(
                parameter="feed_ffa",
                current_value=data.current_operation.feed_ffa,
                suggested_value=max(1.0, data.current_operation.feed_ffa - 0.5),
                expected_improvement_percentage=5.0,
                confidence_level="high",
                implementation_difficulty="medium"
            ))
        
        # Suggest optimizing moisture
        if data.current_operation.moisture > 0.2:
            suggestions.append(OptimizationSuggestion(
                parameter="moisture",
                current_value=data.current_operation.moisture,
                suggested_value=0.15,
                expected_improvement_percentage=3.0,
                confidence_level="medium",
                implementation_difficulty="easy"
            ))
        
        # Suggest optimizing chemical quantities
        total_chemicals = (data.current_operation.bleaching_earth_quantity + 
                          data.current_operation.phosphoric_acid_quantity + 
                          data.current_operation.citric_acid_quantity)
        if total_chemicals > 100:
            suggestions.append(OptimizationSuggestion(
                parameter="chemical_quantities",
                current_value=total_chemicals,
                suggested_value=total_chemicals * 0.9,
                expected_improvement_percentage=4.0,
                confidence_level="medium",
                implementation_difficulty="easy"
            ))
        
        # Calculate potential improvement
        total_improvement = sum(s.expected_improvement_percentage for s in suggestions)
        potential_loss_reduction = min(20.0, total_improvement)
        optimization_score = min(100, (potential_loss_reduction / current_loss) * 100) if current_loss > 0 else 100
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return OptimizationResponse(
            current_loss_percentage=current_loss,
            potential_loss_reduction=round(potential_loss_reduction, 2),
            optimization_score=round(optimization_score, 2),
            suggestions=suggestions,
            expected_roi_percentage=round(potential_loss_reduction * 1.5, 2),
            implementation_timeline_days=len(suggestions) * 7,  # 1 week per suggestion
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Parameter optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Parameter optimization failed: {str(e)}")

# Quality analysis endpoint
@app.post("/analysis/quality", response_model=QualityAnalysisResponse)
async def analyze_quality(data: QualityAnalysisRequest):
    """Comprehensive quality analysis"""
    start_time = datetime.now()
    
    try:
        prediction = enhance_prediction(data.operation)
        
        # Define quality standards (can be customized)
        default_standards = {
            "yield_percentage": 85.0,
            "process_efficiency": 80.0,
            "energy_efficiency": 75.0,
            "chemical_efficiency": 85.0
        }
        
        standards = {**default_standards, **data.quality_standards}
        
        # Calculate compliance scores
        compliance_scores = {
            "yield_compliance": (prediction.yield_analysis.actual_yield_percentage / standards["yield_percentage"]) * 100,
            "process_compliance": (prediction.yield_analysis.process_efficiency / standards["process_efficiency"]) * 100,
            "energy_compliance": (prediction.process_metrics.energy_efficiency_percentage / standards["energy_efficiency"]) * 100,
            "chemical_compliance": (prediction.process_metrics.chemical_efficiency_percentage / standards["chemical_efficiency"]) * 100
        }
        
        overall_compliance = np.mean(list(compliance_scores.values()))
        
        # Determine quality level
        if overall_compliance >= 95:
            quality_level = QualityLevel.EXCELLENT
        elif overall_compliance >= 85:
            quality_level = QualityLevel.GOOD
        elif overall_compliance >= 70:
            quality_level = QualityLevel.FAIR
        else:
            quality_level = QualityLevel.POOR
        
        # Generate recommendations
        recommendations = []
        if compliance_scores["yield_compliance"] < 100:
            recommendations.append("Improve yield optimization to meet quality standards")
        if compliance_scores["energy_compliance"] < 100:
            recommendations.append("Enhance energy efficiency processes")
        if compliance_scores["chemical_compliance"] < 100:
            recommendations.append("Optimize chemical usage and efficiency")
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return QualityAnalysisResponse(
            overall_quality_score=round(prediction.yield_analysis.quality_score, 2),
            quality_level=quality_level,
            compliance_percentage=round(overall_compliance, 2),
            quality_breakdown=compliance_scores,
            recommendations=recommendations,
            improvement_potential=round(100 - overall_compliance, 2),
            processing_time_ms=round(processing_time, 2),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Quality analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Quality analysis failed: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Mount Meru Refinery Operations API",
        "version": "3.0.0",
        "status": "operational" if model_manager.is_ready() else "degraded",
        "models_loaded": model_manager.is_ready(),
        "description": "Comprehensive API for refinery operations including loss prediction, yield analysis, and process optimization",
        "endpoints": {
            "GET /": "This endpoint - API information",
            "GET /health": "Health check and system status",
            "GET /models/status": "Model loading status and metadata",
            "POST /predict": "Single prediction with comprehensive analysis",
            "POST /predict/legacy": "Legacy prediction endpoint (backward compatibility)",
            "POST /batch/predict": "Batch predictions with statistical analysis",
            "POST /analysis/yield": "Detailed yield analysis and recommendations",
            "POST /analysis/loss-breakdown": "Loss source analysis and improvement opportunities",
            "POST /analysis/process-efficiency": "Process efficiency analysis and bottleneck identification",
            "POST /optimize/parameters": "Parameter optimization suggestions",
            "POST /analysis/quality": "Quality analysis and compliance assessment"
        },
        "documentation": "Full API documentation available at /docs",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/docs")
async def get_docs():
    """API documentation and endpoint overview"""
    return {
        "api_title": "Enhanced Refinery Operations API",
        "version": "3.0.0",
        "description": "Comprehensive API for refinery operations including loss prediction, yield analysis, and process optimization",
        "endpoints": {
            "GET /": "API information and status",
            "GET /health": "Health check and system status",
            "GET /models/status": "Model loading status and metadata",
            "POST /predict": "Single prediction with comprehensive analysis",
            "POST /predict/legacy": "Legacy prediction endpoint (backward compatibility)",
            "POST /batch/predict": "Batch predictions with statistical analysis",
            "POST /analysis/yield": "Detailed yield analysis and recommendations",
            "POST /analysis/loss-breakdown": "Loss source analysis and improvement opportunities",
            "POST /analysis/process-efficiency": "Process efficiency analysis and bottleneck identification",
            "POST /optimize/parameters": "Parameter optimization suggestions",
            "POST /analysis/quality": "Quality analysis and compliance assessment"
        },
        "documentation": "Full API documentation available at /docs",
        "timestamp": datetime.now().isoformat()
    }

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
