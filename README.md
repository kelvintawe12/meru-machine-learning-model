# Refinery Loss Prediction API

A FastAPI-based machine learning API for predicting refinery loss percentage based on process parameters.

## Overview

This API provides real-time predictions for refinery loss using pre-trained machine learning models. It features robust error handling, input validation, and comprehensive monitoring capabilities.

## Features

- **FastAPI-based REST API** with automatic documentation
- **Robust error handling** and logging
- **Input validation** with realistic constraints
- **Model management** with automatic loading and validation
- **Health monitoring** endpoints
- **CORS support** for web applications
- **Docker containerization** with optimized image size
- **Comprehensive logging** for debugging and monitoring

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the API:**
   ```bash
   cd deployment
   python app.py
   ```

3. **Access the API:**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### Docker Deployment

1. **Build the image:**
   ```bash
   cd deployment
   docker build -t refinery-loss-api .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 -v $(pwd)/models:/app/models refinery-loss-api
   ```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns API status and model loading state

### Model Status
- **GET** `/models/status`
- Returns detailed status of all loaded models

### Prediction
- **POST** `/predict`
- Predicts refinery loss based on input parameters

## API Input Format

The API expects the following parameters in JSON format:

```json
{
  "percentage_yield": 85.5,
  "gravity": 0.85,
  "vapour_pressure": 2.3,
  "ten_percent_distillation": 180.0,
  "fraction_end_point": 350.0,
  "actual_feed_mt": 100.5,
  "feed_ffa": 1.2,
  "moisture": 0.5,
  "bleaching_earth_quantity": 15.0,
  "phosphoric_acid_quantity": 2.5,
  "citric_acid_quantity": 1.8,
  "phenamol_quantity": 0.8,
  "fractionation_feed": 95.0,
  "phenomol_consumption": 0.6
}
```

### Parameter Constraints

| Parameter | Min | Max | Description |
|-----------|-----|-----|-------------|
| `percentage_yield` | 0 | 100 | Percentage yield |
| `gravity` | 0 | 2 | Gravity value |
| `feed_ffa` | 0 | 50 | Feed FFA percentage |
| `moisture` | 0 | 10 | Moisture percentage |
| All others | 0 | ∞ | Non-negative values |

## API Response Format

```json
{
  "prediction": 2.345,
  "confidence_level": "high",
  "processing_time_ms": 45.67,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Response Fields

- **prediction**: Predicted refinery loss percentage
- **confidence_level**: Confidence level (high/medium/low)
- **processing_time_ms**: Processing time in milliseconds
- **timestamp**: ISO format timestamp

## Configuration

### Environment Variables

- `MODELS_DIR`: Directory containing model files (default: "models")
- `HOST`: Server host (default: "0.0.0.0")
- `PORT`: Server port (default: 8000)
- `RELOAD`: Enable auto-reload for development (default: "false")

### Model Files Required

Place the following files in the models directory:
- `best_real_loss_model.pkl` - Trained ML model
- `real_scaler.pkl` - Feature scaler
- `poly_real.pkl` - Polynomial feature transformer
- `selector_real.pkl` - Feature selector

## Error Handling

The API provides detailed error responses:

- **400 Bad Request**: Invalid input data or constraints violated
- **503 Service Unavailable**: Models not loaded or unavailable
- **500 Internal Server Error**: Prediction processing failed

## Monitoring

### Logging

The API logs:
- Model loading status
- Prediction requests and results
- Error conditions and stack traces
- Performance metrics

### Health Monitoring

- `/health` endpoint provides system status
- `/models/status` shows individual model states
- All responses include timestamps for monitoring

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest httpx

# Run tests
pytest tests/
```

### API Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"percentage_yield": 85.5, ...}'
```

## Performance

- **Response Time**: Typically < 50ms
- **Image Size**: ~200MB (vs 8GB+ with RAPIDS)
- **Memory Usage**: Minimal with lazy loading

## Security

- Input validation and sanitization
- CORS configuration for cross-origin requests
- No authentication (add if needed for production)

## Troubleshooting

### Common Issues

1. **Models not loading**
   - Check model files exist in models directory
   - Verify file permissions
   - Check logs for specific errors

2. **Docker build fails**
   - Ensure all model files are present
   - Check Dockerfile syntax
   - Verify requirements.txt format

3. **High memory usage**
   - Models are loaded once at startup
   - Consider model optimization for large datasets
   - Monitor memory usage with Docker stats

## License

This project is provided as-is for refinery loss prediction tasks.

## Support

For issues or questions:
1. Check the logs for error details
2. Verify model files and input format
3. Test with the provided sample data
