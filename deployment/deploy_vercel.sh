#!/bin/bash
# Quick deployment script for Vercel

echo "🚀 Mount Meru ML Model - Vercel Deployment Package"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "vercel_deployment/app.py" ]; then
    echo "❌ Error: Please run this from the deployment directory"
    exit 1
fi

echo "📦 Deployment Package Contents:"
echo "├── app.py                     # Vercel-optimized FastAPI app"
echo "├── requirements.txt           # Python dependencies"
echo "├── vercel.json               # Vercel configuration"
echo "└── optimized_models/         # Compressed ML models"
echo "    ├── best_real_loss_model.pkl.gz"
echo "    ├── real_scaler.pkl.gz"
echo "    ├── poly_real.pkl.gz"
echo "    └── selector_real.pkl.gz"
echo ""

echo "📊 Model Optimization Results:"
ls -lh optimized_models/
echo ""

echo "🚀 Deployment Instructions:"
echo ""
echo "1. Deploy to Vercel:"
echo "   cd deployment/vercel_deployment"
echo "   vercel --prod"
echo ""
echo "2. Test your API:"
echo "   curl https://your-app.vercel.app/health"
echo ""
echo "3. Deploy Frontend (optional):"
echo "   cd ../dashboard"
echo "   echo 'REACT_APP_API_URL=https://your-app.vercel.app' > .env.production"
echo "   vercel --prod"
echo ""

echo "✅ Your ML models are optimized and ready for Vercel!"
echo "📖 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
