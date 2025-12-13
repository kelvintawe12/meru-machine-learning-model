# Refinery Operations Endpoints Enhancement Plan

## Current Status Analysis
- Existing API has basic `/predict` endpoint that returns loss values
- User requests more refinery operation endpoints
- Need to compute losses and yields in percentages

## Proposed New Endpoints

### 1. Batch Prediction Endpoint
**POST** `/batch/predict`
- Accept multiple prediction requests at once
- Return array of predictions with processing times
- Optimize for high-volume operations

### 2. Yield Analysis Endpoint  
**POST** `/analysis/yield`
- Calculate yield percentages from input parameters
- Return detailed yield breakdown by operation type
- Include efficiency metrics

### 3. Loss Breakdown Endpoint
**POST** `/analysis/loss-breakdown`
- Decompose total loss into component losses
- Show percentage contribution of each loss type
- Identify primary loss sources

### 4. Optimization Suggestion Endpoint
**POST** `/optimize/parameters`
- Suggest optimal parameter values to minimize losses
- Return percentage improvement potential
- Include confidence intervals

### 5. Historical Analysis Endpoint
**POST** `/analysis/historical`
- Compare current operation with historical data
- Return percentile rankings
- Show trend analysis

### 6. Process Efficiency Endpoint
**POST** `/analysis/efficiency`
- Calculate overall process efficiency percentage
- Break down efficiency by operation stage
- Return improvement recommendations

### 7. Cost Analysis Endpoint
**POST** `/analysis/cost`
- Calculate operational costs based on losses
- Return cost per unit processed
- Include percentage cost breakdown

### 8. Quality Metrics Endpoint
**POST** `/analysis/quality`
- Calculate product quality metrics
- Return percentage compliance with standards
- Include quality score

## Response Format Improvements
All endpoints will return results in percentage format where applicable:
```json
{
  "status": "success",
  "timestamp": "2025-12-13T01:55:00",
  "data": {
    "loss_percentage": 2.45,
    "yield_percentage": 97.55,
    "efficiency_percentage": 94.2,
    "confidence_level": "high"
  },
  "processing_time_ms": 45.67
}
```

## Implementation Priority
1. **High Priority**: Batch prediction, Yield analysis, Loss breakdown
2. **Medium Priority**: Process efficiency, Optimization suggestions  
3. **Low Priority**: Historical analysis, Cost analysis, Quality metrics

## Technical Considerations
- Maintain backward compatibility with existing `/predict` endpoint
- Add comprehensive input validation for new endpoints
- Implement rate limiting for batch operations
- Add detailed logging for each operation type
- Include performance optimization for multiple requests

## Validation Requirements
- All percentage values constrained between 0-100%
- Input validation for refinery-specific parameters
- Range checking for process variables
- Error handling for invalid combinations

## Testing Strategy
- Unit tests for each new endpoint
- Integration tests for endpoint combinations
- Performance tests for batch operations
- Validation tests for percentage calculations
