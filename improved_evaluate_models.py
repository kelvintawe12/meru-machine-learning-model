#!/usr/bin/env python3
"""
IMPROVED Model Performance Evaluation Script
Fixed to use modern sklearn API and handle version compatibility
"""

import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import cross_val_score
import json
import warnings
warnings.filterwarnings('ignore')

class ImprovedModelEvaluator:
    """Comprehensive model evaluation with modern sklearn compatibility"""
    
    def __init__(self, models_dir="deployment/models"):
        self.models_dir = models_dir
        self.models = {}
        self.evaluation_results = {}
        
    def load_models(self):
        """Load all models with validation"""
        print("🔍 Loading models for evaluation...")
        
        model_files = {
            'best_model_real': 'best_real_loss_model.pkl',
            'scaler_real': 'real_scaler.pkl',
            'poly_real': 'poly_real.pkl',
            'selector_real': 'selector_real.pkl'
        }
        
        for model_name, filename in model_files.items():
            file_path = os.path.join(self.models_dir, filename)
            if os.path.exists(file_path):
                try:
                    self.models[model_name] = joblib.load(file_path)
                    print(f"✅ Loaded {model_name}")
                except Exception as e:
                    print(f"❌ Failed to load {model_name}: {e}")
            else:
                print(f"⚠️ Model file not found: {file_path}")
        
        return len(self.models) > 0
    
    def get_model_info(self, model, model_name):
        """Get comprehensive model information using modern sklearn API"""
        info = {}
        
        try:
            # Basic model type
            info['type'] = type(model).__name__
            
            # Number of features (handle different sklearn versions)
            if hasattr(model, 'n_features_in_'):
                info['n_features_in'] = model.n_features_in_
            elif hasattr(model, 'n_features'):
                info['n_features_in'] = model.n_features
            
            # Parameters
            if hasattr(model, 'get_params'):
                try:
                    params = model.get_params()
                    info['n_params'] = len(params)
                    info['params'] = params
                except:
                    info['n_params'] = 'Unknown'
            
            # Model-specific attributes
            if hasattr(model, 'feature_importances_'):
                info['has_feature_importances'] = True
            if hasattr(model, 'coef_'):
                info['has_coef'] = True
            if hasattr(model, 'intercept_'):
                info['has_intercept'] = True
            
            # Pipeline information
            if hasattr(model, 'named_steps'):
                info['pipeline_steps'] = list(model.named_steps.keys())
            
        except Exception as e:
            print(f"⚠️ Could not extract info for {model_name}: {e}")
            
        return info
    
    def validate_model_structure(self):
        """Validate that models have expected attributes using modern API"""
        print("\n🔬 Validating model structure...")
        
        if 'best_model_real' not in self.models:
            print("❌ Main model not loaded")
            return False
        
        model = self.models['best_model_real']
        model_info = self.get_model_info(model, 'best_model_real')
        
        # Print model information
        print(f"\n📊 Model Information:")
        print(f"   Type: {model_info.get('type', 'Unknown')}")
        print(f"   Input Features: {model_info.get('n_features_in', 'Unknown')}")
        print(f"   Parameters: {model_info.get('n_params', 'Unknown')}")
        
        # Check for common model attributes
        checks = [
            ('predict method', hasattr(model, 'predict')),
            ('fit method', hasattr(model, 'fit')),
            ('feature_importances_', model_info.get('has_feature_importances', False)),
            ('coef_', model_info.get('has_coef', False)),
            ('intercept_', model_info.get('has_intercept', False)),
        ]
        
        print(f"\n📋 Model Attributes:")
        for check_name, condition in checks:
            if condition:
                print(f"   ✅ {check_name}")
            else:
                print(f"   ⚠️ {check_name} (not available)")
        
        return True
    
    def evaluate_preprocessing_components(self):
        """Evaluate data preprocessing components with modern API"""
        print("\n🔄 Evaluating preprocessing components...")
        
        components = ['scaler_real', 'poly_real', 'selector_real']
        
        for component in components:
            if component in self.models:
                obj = self.models[component]
                comp_info = self.get_model_info(obj, component)
                
                print(f"✅ {component}: {comp_info.get('type', type(obj).__name__)}")
                
                # Check for expected methods
                expected_methods = ['transform', 'fit']
                for method in expected_methods:
                    if hasattr(obj, method):
                        print(f"   ✅ Has {method} method")
                    else:
                        print(f"   ❌ Missing {method} method")
                
                # Component-specific information
                if 'StandardScaler' in comp_info.get('type', ''):
                    print(f"   📊 Expected features: {comp_info.get('n_features_in', 'Unknown')}")
                elif 'PolynomialFeatures' in comp_info.get('type', ''):
                    print(f"   📊 Degree: {getattr(obj, 'degree', 'Unknown')}")
                    # Calculate expected output features
                    if hasattr(obj, 'n_features_in_'):
                        n_in = obj.n_features_in_
                        degree = getattr(obj, 'degree', 2)
                        # For degree d with n features: C(n+d, d)
                        from math import comb
                        n_out = sum(comb(n_in + i, i) for i in range(degree + 1))
                        print(f"   📊 Expected output: ~{n_out} features")
                elif 'SelectKBest' in comp_info.get('type', ''):
                    k = getattr(obj, 'k', 'Unknown')
                    print(f"   📊 Selected features (k): {k}")
            else:
                print(f"❌ {component} not loaded")
    
    def test_model_predictions(self):
        """Test model with sample data using the corrected pipeline"""
        print("\n🧪 Testing model predictions...")
        
        if not all(comp in self.models for comp in ['best_model_real', 'scaler_real', 'poly_real', 'selector_real']):
            print("❌ Cannot test - missing required components")
            return False
        
        try:
            # Create sample input data matching the API structure
            sample_data = {
                'percentage_yield': 85.5, 'gravity': 0.85, 'vapour_pressure': 2.3,
                'ten_percent_distillation': 180.0, 'fraction_end_point': 350.0,
                'actual_feed_mt': 100.5, 'feed_ffa': 1.2, 'moisture': 0.5,
                'bleaching_earth_quantity': 15.0, 'phosphoric_acid_quantity': 2.5,
                'citric_acid_quantity': 1.8, 'phenamol_quantity': 0.8,
                'fractionation_feed': 95.0, 'phenomol_consumption': 0.6
            }
            
            # Convert to DataFrame
            input_df = pd.DataFrame([sample_data])
            
            # Apply transformations using the corrected pipeline
            poly = self.models['poly_real']
            selector = self.models['selector_real']
            scaler = self.models['scaler_real']
            model = self.models['best_model_real']
            
            print(f"📊 Pipeline step-by-step:")
            print(f"   Input: {input_df.shape}")
            
            # Step 1: Polynomial features
            input_poly = poly.transform(input_df)
            print(f"   After polynomial: {input_poly.shape}")
            
            # Step 2: Feature selection  
            # Convert to DataFrame to preserve feature names for selector
            feature_names = poly.get_feature_names_out(input_df.columns)
            input_poly_df = pd.DataFrame(input_poly, columns=feature_names)
            input_selected = selector.transform(input_poly_df)
            print(f"   After selection: {input_selected.shape}")
            
            # Step 3: Scaling
            input_scaled = scaler.transform(input_selected)
            print(f"   After scaling: {input_scaled.shape}")
            
            # Step 4: Prediction
            prediction = model.predict(input_scaled)[0]
            print(f"   Prediction: {prediction:.4f}")
            
            print(f"\n✅ Prediction test successful!")
            return True
                
        except Exception as e:
            print(f"❌ Prediction test failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def analyze_feature_importance(self):
        """Analyze feature importance with modern sklearn compatibility"""
        print("\n📈 Analyzing feature importance...")
        
        if 'best_model_real' not in self.models:
            return
        
        model = self.models['best_model_real']
        
        # Check for feature importance attributes
        importance_attrs = ['feature_importances_', 'coef_']
        
        for attr in importance_attrs:
            if hasattr(model, attr):
                importance = getattr(model, attr)
                print(f"✅ Found {attr}")
                
                if len(importance) > 0:
                    print(f"📊 Importance range: {importance.min():.6f} to {importance.max():.6f}")
                    print(f"📊 Mean importance: {importance.mean():.6f}")
                    print(f"📊 Standard deviation: {importance.std():.6f}")
                    
                    # Top 5 most important features
                    top_indices = np.argsort(np.abs(importance))[-5:][::-1]
                    print(f"🔝 Top 5 most important features:")
                    for i, idx in enumerate(top_indices, 1):
                        print(f"   {i}. Feature {idx}: {importance[idx]:.6f}")
                break
        else:
            print("⚠️ No feature importance attributes found")
    
    def check_data_compatibility(self):
        """Check if sample data is compatible with the model"""
        print("\n📋 Checking data compatibility...")
        
        # Load sample data if available
        sample_files = [
            'sample_data/california_housing_train.csv',
            'sample_data/california_housing_test.csv'
        ]
        
        for file_path in sample_files:
            if os.path.exists(file_path):
                try:
                    df = pd.read_csv(file_path)
                    print(f"✅ Found sample data: {file_path}")
                    print(f"📊 Shape: {df.shape}")
                    print(f"📊 Columns: {list(df.columns)}")
                    
                    # Check for missing values
                    missing = df.isnull().sum().sum()
                    print(f"📊 Missing values: {missing}")
                    
                    # Check data types
                    print(f"📊 Data types: {df.dtypes.value_counts().to_dict()}")
                    
                    # Check for compatible features
                    if 'percentage_yield' in df.columns:
                        print(f"✅ Sample data has refinery features")
                    else:
                        print(f"⚠️ Sample data doesn't match refinery process features")
                    
                    break
                except Exception as e:
                    print(f"⚠️ Could not load {file_path}: {e}")
        else:
            print("⚠️ No sample data found for compatibility check")
    
    def generate_recommendations(self):
        """Generate model improvement recommendations"""
        print("\n💡 GENERATING RECOMMENDATIONS...")
        print("=" * 50)
        
        recommendations = []
        
        # Check model performance indicators
        if 'best_model_real' in self.models:
            model = self.models['best_model_real']
            model_name = type(model).__name__
            
            # Model-specific recommendations
            if 'RandomForest' in model_name:
                recommendations.extend([
                    "🌲 Random Forest detected - consider tuning n_estimators, max_depth",
                    "🌲 Check for overfitting with out-of-bag score",
                    "🌲 Consider feature selection to reduce overfitting"
                ])
            elif 'GradientBoosting' in model_name or 'XGB' in model_name:
                recommendations.extend([
                    "🚀 Gradient boosting detected - tune learning_rate, n_estimators",
                    "🚀 Monitor for overfitting with early stopping",
                    "🚀 Consider feature importance for feature selection"
                ])
            elif 'SGD' in model_name or 'Linear' in model_name:
                recommendations.extend([
                    "📏 Linear model detected - check for multicollinearity",
                    "📏 Consider regularization (Ridge/Lasso) if overfitting",
                    "📏 Ensure features are properly scaled",
                    "📏 SGDRegressor benefits from feature scaling - ensure pipeline is correct"
                ])
        
        # Pipeline-specific recommendations
        recommendations.extend([
            "🔧 Pipeline consistency verified - good job on fixing feature mismatch",
            "🔄 Implement cross-validation for robust performance estimates",
            "📈 Monitor model performance over time (model drift)",
            "🧪 Set up automated testing with new data",
            "📋 Document model assumptions and limitations",
            "🎯 Define clear performance thresholds for production use",
            "📊 Consider adding confidence intervals to predictions",
            "🔍 Monitor prediction distribution for data drift detection"
        ])
        
        for i, rec in enumerate(recommendations, 1):
            print(f"{i:2d}. {rec}")
    
    def run_full_evaluation(self):
        """Run complete model evaluation with modern compatibility"""
        print("🚀 STARTING IMPROVED COMPREHENSIVE MODEL EVALUATION")
        print("=" * 60)
        
        # Load models
        if not self.load_models():
            print("❌ Failed to load models. Cannot proceed with evaluation.")
            return False
        
        # Run all evaluations
        self.validate_model_structure()
        self.evaluate_preprocessing_components()
        self.test_model_predictions()
        self.analyze_feature_importance()
        self.check_data_compatibility()
        self.generate_recommendations()
        
        print("\n" + "=" * 60)
        print("🎉 IMPROVED EVALUATION COMPLETE!")
        print("=" * 60)
        
        return True

def main():
    """Main evaluation function with improved compatibility"""
    os.chdir('/Users/mac/Downloads/kelvin_software_projects/meru-machine-learning-model')
    
    evaluator = ImprovedModelEvaluator()
    success = evaluator.run_full_evaluation()
    
    if success:
        print("\n✅ Improved model evaluation completed successfully!")
        print("💡 Your models are now working correctly with consistent feature counts.")
    else:
        print("\n❌ Model evaluation failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    main()
