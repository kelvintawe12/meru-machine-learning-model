# Mount Meru Refinery ML API - Render Deployment

🚀 **Production-ready deployment package for Render.com**

## 📋 **What's Included**

- `app.py` - Complete FastAPI application with ML models
- `optimized_models/` - Compressed ML models (3.5KB total)
- `requirements.txt` - Python dependencies
- `README.md` - This deployment guide

## 🚀 **Quick Deploy to Render**

### **Step 1: Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: Mount Meru Refinery ML API for Render"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### **Step 2: Deploy on Render**
1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mount-meru-refinery-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `render_deployment/`
   - **Runtime**: `Python 3`

### **Step 3: Environment Configuration**
**Environment Variables** (in Render dashboard):
```
PYTHON_VERSION=3.9.16
PORT=10000
MODEL_PATH=optimized_models
```

**Build Command**:
```bash
pip install -r requirements.txt
```

**Start Command**:
```bash
uvicorn app:app --host 0.0.0.0 --port $PORT
```

### **Step 4: Deploy & Test**
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Test the API endpoints

## 🧪 **Test Your Deployment**

### **Health Check**:
```bash
curl https://your-app-name.onrender.com/health
```

### **Make a Prediction**:
```bash
curl -X POST https://your-app-name.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "percentage_yield": 85.0,
    "gravity": 0.92,
    "vapour_pressure": 2.1,
    "ten_percent_distillation": 320.0,
    "fraction_end_point": 450.0,
    "actual_feed_mt": 100.0,
    "feed_ffa": 2.5,
    "moisture": 0.15,
    "bleaching_earth_quantity": 50.0,
    "phosphoric_acid_quantity": 5.0,
    "citric_acid_quantity": 2.0,
    "phenamol_quantity": 10.0,
    "fractionation_feed": 95.0,
    "phenomol_consumption": 8.0
  }'
```

## 📊 **API Endpoints**

- `GET /` - API information
- `GET /health` - Health check with model status
- `GET /models/status` - Detailed model loading status
- `POST /predict` - Single ML prediction
- `POST /batch/predict` - Batch predictions
- `POST /analysis/yield` - Yield analysis
- `POST /analysis/loss-breakdown` - Loss breakdown
- `POST /analysis/process-efficiency` - Process efficiency
- `POST /optimize/parameters` - Parameter optimization
- `POST /analysis/quality` - Quality analysis
- `GET /docs` - Interactive API documentation

## 🎯 **Expected Response**

```json
{
  "loss_percentage": 2.1,
  "yield_percentage": 97.9,
  "confidence_level": "high",
  "loss_breakdown": {
    "total_loss_percentage": 2.1,
    "raw_material_loss": 0.63,
    "energy_loss": 0.42,
    "process_loss": 0.53,
    "waste_loss": 0.32,
    "efficiency_loss": 0.21
  },
  "yield_analysis": {
    "overall_yield_percentage": 97.9,
    "theoretical_maximum_yield": 98.0,
    "actual_yield_percentage": 97.9,
    "yield_efficiency": 99.9,
    "process_efficiency": 85.0,
    "quality_score": 91.5
  },
  "processing_time_ms": 156.7,
  "timestamp": "2024-12-13T09:35:00.000Z",
  "request_id": "abc123-def456-ghi789"
}
```

## 🔧 **Troubleshooting**

### **Common Issues**:
1. **Build fails**: Check Python version compatibility
2. **Model loading error**: Ensure `MODEL_PATH` environment variable is set
3. **Port binding**: Application must listen on `$PORT` environment variable

### **Logs**: Check Render dashboard logs for detailed error messages.

## 🎉 **Success!**

Once deployed, your Mount Meru Refinery ML API will be:
- ✅ **Highly Available** - 99.9% uptime on Render
- ✅ **Auto-Scaling** - Scales based on demand
- ✅ **Secure** - HTTPS enabled by default
- ✅ **Fast** - Global CDN distribution

**Your ML-powered refinery predictions are now live! 🚀**
