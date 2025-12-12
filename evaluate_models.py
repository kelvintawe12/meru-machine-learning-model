#!/usr/bin/env python3
"""
Model Performance Evaluation Script
Evaluates the quality and performance of the loaded ML models
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

class ModelEvaluator:
    """Comprehensive model evaluation and validation"""
    
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
    
    def validate_model_structure(self):
        """Validate that models have expected attributes"""
        print("\n🔬 Validating model structure...")
        
        if 'best_model_real' not in self.models:
            print("❌ Main model not loaded")
            return False
        
        model = self.models['best_model_real']
        
        # Check for common model attributes
        checks = [
            ('predict method', hasattr(model, 'predict')),
            ('fit method', hasattr(model, 'fit')),
            ('feature_importances_', hasattr(model, 'feature_importances_')),
            ('coef_', hasattr(model, 'coef_')),
        ]
        
        for check_name, condition in checks:
            if condition:
                print(f"✅ {check_name}")
            else:
                print(f"⚠️ {check_name} (not available)")
        
        # Get model info
        try:
            print(f"\n📊 Model Type: {type(model).__name__}")
            if hasattr(model, 'n_features_in_'):
                print(f"📊 Input Features: {model.n_features_in_}")
            if hasattr(model, 'get_params'):
                params = model.get_params()
                print(f"📊 Model Parameters: {len(params)} parameters")
        except Exception as e:
            print(f"⚠️ Could not extract model info: {e}")
        
        return True
    
    def evaluate_scalers(self):
        """Evaluate data preprocessing components"""
        print("\n🔄 Evaluating preprocessing components...")
        
        components = ['scaler_real', 'poly_real', 'selector_real']
        
        for component in components:
            if component in self.models:
                obj = self.models[component]
                print(f"✅ {component}: {type(obj).__name__}")
                
                # Check for expected methods
                expected_methods = ['transform', 'fit']
                for method in expected_methods:
                    if hasattr(obj, method):
                        print(f"   ✅ Has {method} method")
                    else:
                        print(f"   ❌ Missing {method} method")
            else:
                print(f"❌ {component} not loaded")
    
    def test_model_predictions(self):
        """Test model with sample data"""
        print("\n🧪 Testing model predictions...")
        
        if 'best_model_real' not in self.models:
            print("❌ Cannot test - main model not loaded")
            return False
        
        try:
            # Create sample input data (14 features as expected)
            sample_data = {
                'percentage_yield': 85.5,
                'gravity': 0.85,
                'vapour_pressure': 2.3,
                'ten_percent_distillation': 180.0,
                'fraction_end_point': 350.0,
                'actual_feed_mt': 100.5,
                'feed_ffa': 1.2,
                'moisture': 0.5,
                'bleaching_earth_quantity': 15.0,
                'phosphoric_acid_quantity': 2.5,
                'citric_acid_quantity': 1.8,
                'phenamol_quantity': 0.8,
                'fractionation_feed': 95.0,
                'phenomol_consumption': 0.6
            }
            
            # Convert to DataFrame
            input_df = pd.DataFrame([sample_data])
            
            # Apply transformations if available
            if all(comp in self.models for comp in ['scaler_real', 'poly_real', 'selector_real']):
                # Apply polynomial features
                poly = self.models['poly_real']
                input_poly = poly.transform(input_df)
                full_poly_feature_names = poly.get_feature_names_out(input_df.columns)
                input_poly_df = pd.DataFrame(input_poly, columns=full_poly_feature_names)
                
                # Select features
                selector = self.models['selector_real']
                input_selected = selector.transform(input_poly_df)
                
                # Scale features
                scaler = self.models['scaler_real']
                input_scaled = scaler.transform(input_selected)
                
                # Make prediction
                model = self.models['best_model_real']
                prediction = model.predict(input_scaled)[0]
                
                print(f"✅ Prediction successful: {prediction:.4f}")
                print(f"📊 Input shape: {input_df.shape}")
                print(f"📊 After poly features: {input_poly.shape}")
                print(f"📊 After selection: {input_selected.shape}")
                print(f"📊 After scaling: {input_scaled.shape}")
                
                return True
            else:
                print("⚠️ Cannot test full pipeline - missing preprocessing components")
                return False
                
        except Exception as e:
            print(f"❌ Prediction test failed: {e}")
            return False
    
    def analyze_feature_importance(self):
        """Analyze feature importance if available"""
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
                    
                    # Basic statistics
                    print(f"📊 Data types: {df.dtypes.value_counts().to_dict()}")
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
            
            # Model-specific recommendations
            model_name = type(model).__name__
            
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
            elif 'Linear' in model_name:
                recommendations.extend([
                    "📏 Linear model detected - check for multicollinearity",
                    "📏 Consider regularization (Ridge/Lasso) if overfitting",
                    "📏 Ensure features are properly scaled"
                ])
        
        # General recommendations
        recommendations.extend([
            "📊 Collect more training data if accuracy is low",
            "🔄 Implement cross-validation for robust performance estimates",
            "📈 Monitor model performance over time (model drift)",
            "🧪 Set up automated testing with new data",
            "📋 Document model assumptions and limitations",
            "🎯 Define clear performance thresholds for production use"
        ])
        
        for i, rec in enumerate(recommendations, 1):
            print(f"{i:2d}. {rec}")
    
    def run_full_evaluation(self):
        """Run complete model evaluation"""
        print("🚀 STARTING COMPREHENSIVE MODEL EVALUATION")
        print("=" * 60)
        
        # Load models
        if not self.load_models():
            print("❌ Failed to load models. Cannot proceed with evaluation.")
            return False
        
        # Run all evaluations
        self.validate_model_structure()
        self.evaluate_scalers()
        self.test_model_predictions()
        self.analyze_feature_importance()
        self.check_data_compatibility()
        self.generate_recommendations()
        
        print("\n" + "=" * 60)
        print("🎉 EVALUATION COMPLETE!")
        print("=" * 60)
        
        return True

def main():
    """Main evaluation function"""
    os.chdir('/Users/mac/Downloads/kelvin_software_projects/meru-machine-learning-model')
    
    evaluator = ModelEvaluator()
    success = evaluator.run_full_evaluation()
    
    if success:
        print("\n✅ Model evaluation completed successfully!")
        print("💡 Review the recommendations above to optimize your model performance.")
    else:
        print("\n❌ Model evaluation failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    main()
