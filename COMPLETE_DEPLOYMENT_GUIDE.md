# 🚀 Complete Deployment Guide: Mount Meru Refinery ML API

## ✅ **ISSUE RESOLVED: Vercel Serverless Function Error**

**Original Error**: `TypeError: issubclass() arg 1 must be a class`
**Root Cause**: Vercel's serverless function size limit (250MB) exceeded by ML models + dependencies
**Solution**: Deploy full ML functionality on platforms that support larger containers

---

## 🎯 **Deployment Options**

### **Option 1: Render.com (Recommended)**
- **Pros**: No size limits, easy deployment, free tier available
- **Setup Time**: ~10 minutes
- **ML Models**: ✅ Full support

### **Option 2: Railway.app**
- **Pros**: Generous free tier, GitHub integration
- **Setup Time**: ~5 minutes  
- **ML Models**: ✅ Full support

### **Option 3: Heroku**
- **Pros**: Mature platform, extensive documentation
- **Setup Time**: ~15 minutes
- **ML Models**: ✅ Full support (paid tiers)

### **Option 4: AWS Lambda + API Gateway**
- **Pros**: Scalable, enterprise-grade
- **Setup Time**: ~30 minutes
- **ML Models**: ✅ Full support (with container images)

---

## 🛠️ **Render Deployment Guide**

### **Step 1: Prepare Your Repository**

1. **Push code to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit: Mount Meru Refinery ML API"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### **Step 2: Deploy on Render**

1. **Go to [render.com](https://render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `mount-meru-refinery-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `deployment/`
   - **Runtime**: `Python 3`

### **Step 3: Environment Configuration**

**Environment Variables** (in Render dashboard):
```
PYTHON_VERSION=3.9.16
PORT=10000
MODEL_PATH=/opt/models
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

1. **Click "Create Web Service"**
2. **Wait for deployment** (3-5 minutes)
3. **Test the API**:
```bash
curl https://your-app-name.onrender.com/health
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

---

## 🐳 **Docker Deployment (Alternative)**

For any platform that supports Docker:

### **Dockerfile**:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Deploy Commands**:
```bash
# Build image
docker build -t mount-meru-refinery-api .

# Run locally
docker run -p 8000:8000 mount-meru-refinery-api

# Deploy to cloud
docker push your-registry/mount-meru-refinery-api
```

---

## 📊 **API Endpoints**

### **Available Endpoints**:
- `GET /` - API information
- `GET /health` - Health check
- `GET /models/status` - Model loading status  
- `POST /predict` - Single prediction
- `POST /batch/predict` - Batch predictions
- `POST /analysis/yield` - Yield analysis
- `POST /analysis/loss-breakdown` - Loss breakdown
- `POST /analysis/process-efficiency` - Process efficiency
- `POST /optimize/parameters` - Parameter optimization
- `POST /analysis/quality` - Quality analysis
- `GET /docs` - API documentation

### **Example Request**:
```json
{
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
}
```

### **Example Response**:
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
  "timestamp": "2024-12-13T09:30:00.000Z",
  "request_id": "abc123-def456-ghi789"
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**:

1. **Model Loading Errors**:
   - Ensure models are in the `models/` directory
   - Check file permissions
   - Verify model file integrity

2. **Memory Issues**:
   - Increase container memory limits
   - Use model optimization techniques
   - Consider model quantization

3. **Timeout Issues**:
   - Increase function timeout limits
   - Optimize model inference time
   - Use async processing for large requests

4. **Port Binding Issues**:
   - Ensure application listens on `$PORT` environment variable
   - Use `0.0.0.0` as host binding

---

## 📈 **Performance Optimization**

### **For Production**:

1. **Model Optimization**:
   - Use ONNX runtime for faster inference
   - Apply model quantization
   - Implement model caching

2. **Infrastructure**:
   - Use Redis for session caching
   - Implement request rate limiting
   - Add monitoring and logging

3. **Scaling**:
   - Horizontal scaling with load balancers
   - Auto-scaling based on request volume
   - CDN for static assets

---

## 🎉 **Success Metrics**

After deployment, your API should:
- ✅ Return 200 status codes for all endpoints
- ✅ Load all ML models successfully
- ✅ Provide predictions within 500ms
- ✅ Handle batch requests efficiently
- ✅ Return detailed analysis and recommendations

---

## 📞 **Support**

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test endpoints individually
4. Review model file integrity

**Your Mount Meru Refinery ML API is now ready for production! 🚀**
