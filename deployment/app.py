
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os

# 1. Initialize a FastAPI app
app = FastAPI(
    title="Refinery Loss Prediction API",
    description="API for predicting refinery loss percentage based on process parameters."
)

# Define the path to the models directory
MODELS_DIR = 'deployment/models'

# 2. Load the pre-trained model and preprocessing objects
try:
    best_model_real = joblib.load(os.path.join(MODELS_DIR, 'best_real_loss_model.pkl'))
    scaler_real = joblib.load(os.path.join(MODELS_DIR, 'real_scaler.pkl'))
    poly_real = joblib.load(os.path.join(MODELS_DIR, 'poly_real.pkl'))
    selector_real = joblib.load(os.path.join(MODELS_DIR, 'selector_real.pkl'))
    print("Models and scalers loaded successfully.")
except Exception as e:
    print(f"Error loading models or scalers: {e}")
    best_model_real = None
    scaler_real = None
    poly_real = None
    selector_real = None

# Define the base feature names as they were in training (before polynomial transformation)
base_feature_names = ['percentage_yield', 'gravity', 'vapour_pressure', 'ten_percent_distillation',
                      'fraction_end_point', 'actual_feed_mt', 'feed_ffa', 'moisture',
                      'bleaching_earth_quantity', 'phosphoric_acid_quantity', 'citric_acid_quantity',
                      'phenamol_quantity', 'fractionation_feed', 'phenomol_consumption']

# Derive full polynomial feature names for DataFrame creation if selector_real is loaded
if poly_real is not None and selector_real is not None:
    dummy_X_for_names = pd.DataFrame(np.zeros((1, len(base_feature_names))), columns=base_feature_names)
    full_poly_feature_names = poly_real.get_feature_names_out(base_feature_names)
    model_feature_names = full_poly_feature_names[selector_real.get_support()]
else:
    full_poly_feature_names = [] # Fallback
    model_feature_names = [] # Fallback

# 3. Define a Pydantic model for the input data
# This must match the original X_real features before any polynomial transformation
class PredictionInput(BaseModel):
    percentage_yield: float
    gravity: float
    vapour_pressure: float
    ten_percent_distillation: float
    fraction_end_point: float
    actual_feed_mt: float
    feed_ffa: float
    moisture: float
    bleaching_earth_quantity: float
    phosphoric_acid_quantity: float
    citric_acid_quantity: float
    phenamol_quantity: float
    fractionation_feed: float
    phenomol_consumption: float

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

# 4. Create a POST endpoint for predictions
@app.post("/predict")
async def predict_loss(data: PredictionInput):
    if best_model_real is None or scaler_real is None or poly_real is None or selector_real is None:
        return {"error": "Model or scalers not loaded properly. Check server logs.", "prediction": None}

    # Convert incoming request data to pandas DataFrame
    input_df = pd.DataFrame([data.dict()])

    # Ensure column order matches the original training features (base_feature_names)
    input_df = input_df[base_feature_names]

    # Apply polynomial features transformation
    input_poly = poly_real.transform(input_df)
    # Create DataFrame with correct polynomial feature names
    input_poly_df = pd.DataFrame(input_poly, columns=full_poly_feature_names)

    # Select k best features
    input_selected = selector_real.transform(input_poly_df)

    # Scale the input data
    input_scaled = scaler_real.transform(input_selected)

    # Make prediction
    prediction = best_model_real.predict(input_scaled)[0]

    return {"prediction": float(prediction)}

# 5. Include uvicorn.run to allow running the app directly
if __name__ == "__main__":
    # To run this, save the content to app.py and run 'python app.py'
    # Then access at http://127.0.0.1:8000/docs for Swagger UI
    uvicorn.run(app, host="0.0.0.0", port=8000)
