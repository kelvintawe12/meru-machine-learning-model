#!/usr/bin/env python3
"""
Model optimization script for Vercel deployment
Compresses and optimizes ML models for serverless deployment
"""

import joblib
import os
import gzip
import pickle
from pathlib import Path

def compress_model(model_path, compressed_path):
    """Compress model using gzip"""
    with open(model_path, 'rb') as f:
        model_data = f.read()
    
    with gzip.open(compressed_path, 'wb') as f:
        f.write(model_data)
    
    original_size = os.path.getsize(model_path)
    compressed_size = os.path.getsize(compressed_path)
    compression_ratio = (1 - compressed_size / original_size) * 100
    
    print(f"Compressed {model_path}")
    print(f"Original: {original_size / 1024 / 1024:.2f} MB")
    print(f"Compressed: {compressed_size / 1024 / 1024:.2f} MB")
    print(f"Compression: {compression_ratio:.1f}%")
    return compressed_path

def load_compressed_model(compressed_path):
    """Load model from compressed file"""
    with gzip.open(compressed_path, 'rb') as f:
        return pickle.load(f)


def optimize_models():
    """Optimize all models for Vercel deployment"""
    models_dir = Path("deployment/models")
    optimized_dir = Path("optimized_models")
    optimized_dir.mkdir(exist_ok=True)
    
    model_files = [
        "best_real_loss_model.pkl",
        "real_scaler.pkl", 
        "poly_real.pkl",
        "selector_real.pkl"
    ]
    
    print("🔧 Optimizing models for Vercel deployment...")
    print("=" * 50)
    
    for model_file in model_files:
        model_path = models_dir / model_file
        if model_path.exists():
            compressed_path = optimized_dir / f"{model_file}.gz"
            compress_model(model_path, compressed_path)
        else:
            print(f"⚠️  Model not found: {model_path}")
    
    print("\n✅ Model optimization complete!")
    print(f"Optimized models saved to: {optimized_dir}")

if __name__ == "__main__":
    optimize_models()
