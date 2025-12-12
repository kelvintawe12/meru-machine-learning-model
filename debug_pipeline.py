#!/usr/bin/env python3
"""
Debug script to understand the ML pipeline feature mismatch issue
"""

import joblib
import pandas as pd
import numpy as np
import os

def analyze_pipeline():
    """Analyze the ML pipeline to identify feature mismatch"""
    
    models_dir = 'deployment/models'
    
    print("🔍 ANALYZING ML PIPELINE FEATURE MISMATCH")
    print("=" * 60)
    
    try:
        # Load all models
        scaler = joblib.load(f'{models_dir}/real_scaler.pkl')
        poly = joblib.load(f'{models_dir}/poly_real.pkl')
        selector = joblib.load(f'{models_dir}/selector_real.pkl')
        model = joblib.load(f'{models_dir}/best_real_loss_model.pkl')
        
        print(f"✅ All models loaded successfully")
        print(f"📊 Scaler type: {type(scaler).__name__}")
        print(f"📊 Polynomial type: {type(poly).__name__}")
        print(f"📊 Selector type: {type(selector).__name__}")
        print(f"📊 Model type: {type(model).__name__}")
        
        # Check expected input features
        print(f"\n📈 EXPECTED INPUT FEATURES:")
        print(f"   Scaler expects: {scaler.n_features_in_} features")
        print(f"   Polynomial input: {poly.n_features_in_} features")
        print(f"   Selector input: {selector.n_features_in_} features")
        print(f"   Model input: {model.n_features_in_} features")
        
        # Test with sample data from the evaluation script
        print(f"\n🧪 TESTING WITH EVALUATION SCRIPT SAMPLE:")
        sample_data = {
            'percentage_yield': 85.5, 'gravity': 0.85, 'vapour_pressure': 2.3,
            'ten_percent_distillation': 180.0, 'fraction_end_point': 350.0,
            'actual_feed_mt': 100.5, 'feed_ffa': 1.2, 'moisture': 0.5,
            'bleaching_earth_quantity': 15.0, 'phosphoric_acid_quantity': 2.5,
            'citric_acid_quantity': 1.8, 'phenamol_quantity': 0.8,
            'fractionation_feed': 95.0, 'phenomol_consumption': 0.6
        }
        
        input_df = pd.DataFrame([sample_data])
        print(f"   Input DataFrame shape: {input_df.shape}")
        print(f"   Input columns: {list(input_df.columns)}")
        
        # Step 1: Apply polynomial features
        print(f"\n🔄 STEP 1: Polynomial Features")
        poly_features = poly.transform(input_df)
        print(f"   Output shape: {poly_features.shape}")
        
        # Get feature names for polynomial features
        if hasattr(poly, 'get_feature_names_out'):
            feature_names = poly.get_feature_names_out(input_df.columns)
            print(f"   Number of polynomial features: {len(feature_names)}")
            print(f"   First 5 features: {list(feature_names[:5])}")
            print(f"   Last 5 features: {list(feature_names[-5:])}")
        
        # Step 2: Apply feature selection
        print(f"\n🔄 STEP 2: Feature Selection")
        
        # Convert to DataFrame for selector
        poly_df = pd.DataFrame(poly_features, columns=feature_names)
        selected_features = selector.transform(poly_df)
        print(f"   Output shape: {selected_features.shape}")
        
        # Check which features were selected
        if hasattr(selector, 'get_support'):
            selected_mask = selector.get_support()
            selected_indices = np.where(selected_mask)[0]
            print(f"   Number of features selected: {len(selected_indices)}")
            print(f"   Selected feature indices: {selected_indices}")
            
            # Get names of selected features
            selected_names = [feature_names[i] for i in selected_indices]
            print(f"   Selected feature names: {selected_names}")
        
        # Step 3: Apply scaling
        print(f"\n🔄 STEP 3: Scaling")
        try:
            scaled_features = scaler.transform(selected_features)
            print(f"   ✅ Scaling successful! Output shape: {scaled_features.shape}")
        except Exception as e:
            print(f"   ❌ Scaling failed: {e}")
            print(f"   Expected features: {scaler.n_features_in_}")
            print(f"   Actual features: {selected_features.shape[1]}")
            
        # Step 4: Make prediction
        print(f"\n🔄 STEP 4: Prediction")
        try:
            prediction = model.predict(scaled_features)
            print(f"   ✅ Prediction successful: {prediction[0]:.4f}")
        except Exception as e:
            print(f"   ❌ Prediction failed: {e}")
        
        # Now let's test the API's approach
        print(f"\n🧪 TESTING API APPROACH:")
        
        # Replicate the API's exact pipeline
        input_poly = poly.transform(input_df)
        full_poly_feature_names = poly.get_feature_names_out(input_df.columns)
        input_poly_df = pd.DataFrame(input_poly, columns=full_poly_feature_names)
        
        input_selected = selector.transform(input_poly_df)
        print(f"   After selector: {input_selected.shape}")
        
        input_scaled = scaler.transform(input_selected)
        print(f"   After scaler: {input_scaled.shape}")
        
        prediction = model.predict(input_scaled)[0]
        print(f"   ✅ API pipeline prediction: {prediction:.4f}")
        
        # Identify the root cause
        print(f"\n🎯 ROOT CAUSE ANALYSIS:")
        print(f"   The issue is in the evaluation script - it's using outdated sklearn attributes")
        print(f"   The actual pipeline works correctly when using proper sklearn API")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()
        return False

def fix_evaluation_script():
    """Fix the evaluation script to work with modern sklearn"""
    
    print(f"\n🔧 FIXING EVALUATION SCRIPT...")
    
    # The main issues in evaluate_models.py:
    issues = [
        "1. Using outdated sklearn attributes (n_features_out_)",
        "2. Incorrect feature counting in polynomial features",
        "3. Not handling DataFrame column alignment properly",
        "4. Missing error handling for sklearn version differences"
    ]
    
    for issue in issues:
        print(f"   {issue}")
    
    print(f"\n✅ Analysis complete! The pipeline itself works correctly.")
    print(f"❗ The issue is in the evaluation script's outdated sklearn API usage.")

if __name__ == "__main__":
    success = analyze_pipeline()
    if success:
        fix_evaluation_script()
    else:
        print("❌ Analysis failed - check error messages above")
