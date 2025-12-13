# 🚀 Vercel Deployment Guide - Step by Step

## Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: `npm i -g vercel`
3. **Models Optimized**: ✅ Done (15KB total size)

## Step 1: Create Deployment Package

```bash
# Navigate to deployment directory
cd deployment/

# Create deployment package
mkdir -p vercel_deployment
cd vercel_deployment

# Copy optimized models
cp -r ../optimized_models/ .

# Copy Vercel-optimized app
cp ../vercel_app.py app.py

# Copy requirements
cp ../vercel_requirements.txt requirements.txt

# Copy Vercel config
cp ../vercel.json .

# Your package should now contain:
# - app.py
# - requirements.txt
# - vercel.json
# - optimized_models/ (directory with .gz files)
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Login to Vercel
vercel login

# Deploy from deployment directory
vercel --prod

# Follow the prompts:
# ? Set up and deploy? [Y/n] y
# ? Which scope? [your-username]
# ? Link to existing project? [y/N] n
# ? What's your project's name? meru-refinery-ml
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

### Option B: Using Git Integration

1. **Push to GitHub**:
```bash
git add vercel_deployment/
git commit -m "Add Vercel deployment configuration"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Configure deployment settings

## Step 3: Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```bash
# Add these environment variables:
MODEL_PATH=/opt/python/optimized_models
PYTHONPATH=/opt/python
VERCEL=1
```

## Step 4: Test Your Deployment

After deployment, test these endpoints:

### **Health Check**
```bash
curl https://your-app.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00",
  "models_loaded": 4,
  "api_version": "3.0.0",
  "platform": "vercel"
}
```

### **Model Status**
```bash
curl https://your-app.vercel.app/models/status
```

**Expected Response:**
```json
{
  "models_loaded": true,
  "models": {
    "best_model_real": true,
    "scaler_real": true,
    "poly_real": true,
    "selector_real": true
  }
}
```

### **Test Prediction**
```bash
curl -X POST https://your-app.vercel.app/predict \
  -H "Content-Type: application/json" \
  -d '{
    "percentage_yield": 90,
    "gravity": 0.8,
    "vapour_pressure": 3.0,
    "ten_percent_distillation": 250,
    "fraction_end_point": 375,
    "actual_feed_mt": 500,
    "feed_ffa": 2.5,
    "moisture": 0.2,
    "bleaching_earth_quantity": 25,
    "phosphoric_acid_quantity": 1.5,
    "citric_acid_quantity": 0.8,
    "phenamol_quantity": 0.5,
    "fractionation_feed": 90,
    "phenomol_consumption": 0.25
  }'
```

## Step 5: Update Frontend Configuration

Update your React app to use the new Vercel API:

```bash
# Create production environment file
echo "REACT_APP_API_URL=https://your-app.vercel.app" > dashboard/.env.production
echo "REACT_APP_WS_URL=https://your-app.vercel.app/ws" >> dashboard/.env.production
```

## Step 6: Deploy Frontend to Vercel

```bash
# Navigate to dashboard
cd dashboard/

# Build and deploy frontend
vercel --prod

# Your complete stack is now deployed:
# - Backend ML API: https://your-app.vercel.app
# - Frontend Dashboard: https://your-dashboard.vercel.app
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **Cold Start Delays**:
   - First request after inactivity takes 10-30 seconds
   - Solution: Keep API warm with ping requests

2. **Model Loading Errors**:
   - Check that `optimized_models/` directory is included
   - Verify file paths in `load_models()` function

3. **Memory Issues**:
   - Models are small (15KB) so shouldn't be an issue
   - Monitor memory usage in Vercel dashboard

4. **Timeout Issues**:
   - Upgrade to Vercel Pro for 60-second timeout
   - Optimize prediction pipeline if needed

## 📊 Monitoring & Analytics

### **Vercel Dashboard**:
- Monitor function execution times
- Track cold starts and warm starts
- View function logs and errors

### **API Monitoring**:
```bash
# Monitor API health
curl -f https://your-app.vercel.app/health || echo "API down"
```

## 🚀 Production Tips

1. **Performance**:
   - Keep models under 100MB total
   - Use model caching (already implemented)
   - Monitor cold start patterns

2. **Reliability**:
   - Set up health check monitoring
   - Consider multiple regions for global users
   - Implement retry logic in frontend

3. **Cost Optimization**:
   - Vercel Hobby plan: 100GB bandwidth/month
   - Monitor usage in dashboard
   - Consider Pro plan for higher limits

## ✅ Success Checklist

- [ ] Models optimized and compressed
- [ ] Vercel deployment package created
- [ ] Backend API deployed to Vercel
- [ ] Health check endpoint responding
- [ ] Model status showing all models loaded
- [ ] Test prediction working
- [ ] Frontend updated with new API URL
- [ ] Complete stack deployed and functional

## 🎉 Your Deployed API

Once deployed, your ML-powered refinery API will be available at:
**https://your-app.vercel.app**

With endpoints:
- `GET /health` - System status
- `GET /models/status` - ML model status  
- `POST /predict` - Make predictions
- `GET /` - API information
- `GET /docs` - API documentation
