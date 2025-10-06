# ML Model Integration Guide

## Status: 🟡 INFRASTRUCTURE READY - MODELS NEED TRAINING

The ML infrastructure is **fully implemented** but models need to be trained and deployed.

---

## Current State

### ✅ What's Already Implemented

#### 1. **ML API Server** (`backend/src/predictive-analytics/api.py`)
- Flask API with 4 endpoints
- Health check endpoint
- Tenant issue prediction
- Anomaly detection
- Financial forecasting
- Rule-based fallbacks for all predictions

#### 2. **Training Scripts**
- `tenant_behavior.py` - Tenant churn prediction
- `anomaly_detection.py` - Property anomaly detection
- `financial_forecast.py` - Financial forecasting

#### 3. **Backend Integration** (`backend/src/utils/predictiveModels.ts`)
- Calls ML API at `localhost:5000`
- Automatic fallback to rule-based logic
- Error handling and timeout configuration

#### 4. **Service Layer**
- `predictiveAnalytics.service.ts` - Service wrapper
- `tenantIssuePrediction.service.ts` - Tenant predictions
- Integration with API routes

---

## ❌ What's Missing

### Models Not Trained Yet

The ML models (`.pkl` files) don't exist:
- ❌ `models/tenant_behavior_model.pkl`
- ❌ `models/anomaly_detection_model.pkl`
- ❌ `models/financial_forecast_model.pkl`

### Python Dependencies Not Installed

Required packages not installed:
- flask
- numpy
- pandas
- scikit-learn
- joblib
- sqlalchemy
- psycopg2-binary
- imbalanced-learn

---

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies

```bash
cd backend/src/predictive-analytics

# Option 1: Using pip
pip3 install -r requirements.txt

# Option 2: Using virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Dependencies**:
```txt
flask==2.3.3
flask-cors==4.0.0
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
joblib==1.3.2
sqlalchemy==2.0.20
psycopg2-binary==2.9.7
imbalanced-learn==0.11.0
```

### Step 2: Train ML Models

```bash
# Ensure database is populated with data
cd backend
npm run db:seed  # If not already done

# Train tenant behavior model
cd src/predictive-analytics
python3 tenant_behavior.py

# Train anomaly detection model
python3 anomaly_detection.py

# Train financial forecast model
python3 financial_forecast.py
```

**Output**: Creates `.pkl` model files in `models/` directory

### Step 3: Start ML API Server

```bash
cd backend/src/predictive-analytics

# Development
python3 api.py

# Production (with gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api:app
```

**Expected Output**:
```
 * Running on http://0.0.0.0:5000
 * Loaded tenant behavior model
 * Loaded anomaly detection model
 * Loaded financial forecast model
```

### Step 4: Verify ML API

```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-06T10:30:00Z",
  "models_loaded": ["tenant_behavior", "anomaly_detection", "financial_forecast"]
}
```

### Step 5: Test Predictions

```bash
# Test tenant issue prediction
curl -X POST http://localhost:5000/api/predict/tenant-issue \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-123",
    "maintenance_requests": 3,
    "late_payments": 2,
    "missed_payments": 0,
    "total_payments": 12,
    "complaint_messages": 1,
    "months_as_tenant": 8,
    "credit_score": 680,
    "rent_amount": 1800
  }'

# Expected response:
{
  "tenant_id": "test-123",
  "prediction": {
    "issue": "Low risk",
    "confidence": 0.92,
    "risk_score": 0.35,
    "model_used": "ml_model"
  }
}
```

---

## 📊 ML Model Details

### 1. Tenant Behavior Model

**Purpose**: Predict tenant churn and lease termination risk

**Features**:
- Maintenance requests count
- Late/missed payments
- Total payments
- Complaint messages
- Tenure (months as tenant)
- Credit score
- Rent amount

**Output**:
- Issue type (high/low risk)
- Confidence score (0-1)
- Risk score (0-1)

**Algorithm**: Random Forest or Gradient Boosting

### 2. Anomaly Detection Model

**Purpose**: Detect unusual property metrics

**Features**:
- Energy usage
- Water usage
- Maintenance costs
- Occupancy rate

**Output**:
- Anomaly detected (boolean)
- Model used (ml_model/rule_based)

**Algorithm**: Isolation Forest or One-Class SVM

### 3. Financial Forecast Model

**Purpose**: Forecast property revenue and expenses

**Features**:
- Historical revenue/expenses
- Seasonality patterns
- Market trends

**Output**:
- Monthly forecasts
- Confidence intervals

**Algorithm**: Time series (ARIMA or LSTM)

---

## 🔧 Configuration

### Environment Variables

Add to `backend/.env`:

```bash
# ML API Configuration
ML_API_URL=http://localhost:5000
ML_API_PORT=5000
ML_API_TIMEOUT=5000

# Database for ML training
DATABASE_URL=postgresql://user:password@localhost:5432/propertyai
```

### Service Configuration

In `predictiveModels.ts`:

```typescript
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';
const ML_API_TIMEOUT = parseInt(process.env.ML_API_TIMEOUT || '5000', 10);
```

---

## 🔄 Integration Flow

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend Service │ (predictTenantIssue)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ML API Call   │ POST /api/predict/tenant-issue
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
  Success    Failure
    │          │
    ▼          ▼
┌────────┐  ┌──────────────┐
│ML Model│  │ Rule-Based   │
│Predict │  │ Fallback     │
└───┬────┘  └──────┬───────┘
    │              │
    └──────┬───────┘
           │
           ▼
    ┌────────────┐
    │  Response  │
    └────────────┘
```

---

## 🧪 Testing

### Manual Testing Steps

#### 1. Test ML API Directly

```bash
# Health check
curl http://localhost:5000/health

# Tenant prediction
curl -X POST http://localhost:5000/api/predict/tenant-issue \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "123", "late_payments": 3, "maintenance_requests": 5}'
```

#### 2. Test Through Backend API

```bash
# Get JWT token first
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  | jq -r '.token')

# Test prediction
curl -X POST http://localhost:3001/api/tenants/tenant-screening/predict-issues \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "123", "late_payments": 3}'
```

### Automated Testing

Create test script (`backend/src/predictive-analytics/test_api.py`):

```python
import requests
import json

BASE_URL = 'http://localhost:5000'

def test_health():
    response = requests.get(f'{BASE_URL}/health')
    assert response.status_code == 200
    print("✓ Health check passed")

def test_tenant_prediction():
    data = {
        "tenant_id": "test-123",
        "maintenance_requests": 3,
        "late_payments": 2,
        "missed_payments": 0,
        "total_payments": 12
    }
    response = requests.post(f'{BASE_URL}/api/predict/tenant-issue', json=data)
    assert response.status_code == 200
    print("✓ Tenant prediction passed")

if __name__ == '__main__':
    test_health()
    test_tenant_prediction()
    print("\nAll tests passed!")
```

---

## 📈 Model Performance

### Expected Metrics

**Tenant Behavior Model**:
- Accuracy: >80%
- Precision: >75%
- Recall: >70%
- F1-Score: >72%

**Anomaly Detection**:
- False Positive Rate: <5%
- True Positive Rate: >85%

**Financial Forecast**:
- MAPE (Mean Absolute Percentage Error): <15%
- R² Score: >0.75

---

## 🔒 Security Considerations

### API Security

**Current**: No authentication on ML API
**Recommendation**: Add API key authentication

```python
# In api.py
API_KEY = os.environ.get('ML_API_KEY', 'dev-key-change-in-prod')

@app.before_request
def check_api_key():
    if request.endpoint != 'health_check':
        api_key = request.headers.get('X-API-Key')
        if api_key != API_KEY:
            return jsonify({'error': 'Invalid API key'}), 401
```

**Backend Update**:
```typescript
// In predictiveModels.ts
const response = await axios.post(
  `${ML_API_URL}/api/predict/tenant-issue`,
  requestData,
  {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.ML_API_KEY
    }
  }
);
```

### Data Privacy

- ✅ No PII sent to ML API (only aggregated metrics)
- ✅ Predictions logged in audit system
- ✅ GDPR compliant (anonymized data)

---

## 🚀 Deployment

### Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: ML API
cd backend/src/predictive-analytics
source venv/bin/activate
python3 api.py
```

### Production

#### Using Docker

Create `Dockerfile` for ML API:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY models/ models/

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "api:app"]
```

Build and run:

```bash
docker build -t propertyai-ml-api .
docker run -p 5000:5000 --env-file .env propertyai-ml-api
```

#### Using Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: ml-api
        image: propertyai-ml-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: ML_API_PORT
          value: "5000"
```

---

## 📝 Quick Start Checklist

### Minimum Viable ML Integration

- [ ] Install Python dependencies
- [ ] Create models directory
- [ ] Train at least one model (tenant_behavior)
- [ ] Start ML API server
- [ ] Verify health endpoint
- [ ] Test one prediction
- [ ] Update backend .env with ML_API_URL

### Full Production Setup

- [ ] All dependencies installed
- [ ] All three models trained
- [ ] Model performance validated
- [ ] ML API deployed with monitoring
- [ ] Backend integration tested
- [ ] Error handling verified
- [ ] API key authentication added
- [ ] Load testing completed
- [ ] Documentation updated

---

## 🎯 Implementation Steps

### Phase 1: Local Development Setup (1-2 hours)

```bash
# 1. Install dependencies
cd backend/src/predictive-analytics
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Create models directory
mkdir -p models

# 3. Train models (requires populated database)
cd ../../
npm run db:seed  # Ensure data exists
cd src/predictive-analytics
python3 tenant_behavior.py
python3 anomaly_detection.py
python3 financial_forecast.py

# 4. Start ML API
python3 api.py

# 5. Verify in another terminal
curl http://localhost:5000/health
```

### Phase 2: Backend Integration (30 mins)

```bash
# 1. Update .env
echo "ML_API_URL=http://localhost:5000" >> backend/.env
echo "ML_API_TIMEOUT=5000" >> backend/.env

# 2. Restart backend
cd backend
npm run dev

# 3. Test predictions through backend API
```

### Phase 3: Testing & Validation (1 hour)

- Test each prediction endpoint
- Verify fallback logic works
- Load test with concurrent requests
- Monitor error rates

---

## 🔍 Troubleshooting

### Issue: Models Directory Not Found

```bash
cd backend/src/predictive-analytics
mkdir -p models
```

### Issue: Python Dependencies Missing

```bash
pip3 install -r requirements.txt
```

### Issue: Database Connection Failed

Check `DATABASE_URL` in environment:
```bash
export DATABASE_URL=postgresql://user:pass@localhost:5432/propertyai
```

### Issue: No Training Data

```bash
cd backend
npm run db:seed
```

### Issue: ML API Not Responding

```bash
# Check if running
lsof -i :5000

# Check logs
python3 api.py  # Run in foreground to see errors
```

### Issue: Predictions Always Use Fallback

**Symptom**: `model_used: 'rule_based'` in responses

**Causes**:
1. Models not trained (no `.pkl` files)
2. Models failed to load (check logs)
3. Feature mismatch (check model inputs)

**Solution**: Train models and restart API

---

## 📊 Model Training

### Training Requirements

**Minimum Data**:
- Tenant behavior: 100+ tenant records
- Anomaly detection: 50+ properties with metrics
- Financial forecast: 12+ months of data per property

**Recommended Data**:
- Tenant behavior: 1000+ tenants
- Anomaly detection: 200+ properties
- Financial forecast: 24+ months

### Training Process

Each training script:
1. Connects to PostgreSQL database
2. Queries historical data
3. Preprocesses features
4. Trains model with cross-validation
5. Evaluates performance
6. Saves model to `models/` directory
7. Outputs performance metrics

### Training Time

- Tenant behavior: ~2-5 minutes
- Anomaly detection: ~1-3 minutes
- Financial forecast: ~3-7 minutes

**Total**: ~10-15 minutes with sufficient data

---

## 🎯 API Endpoints

### 1. Health Check

```
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-06T10:30:00Z",
  "models_loaded": ["tenant_behavior", "anomaly_detection"]
}
```

### 2. Tenant Issue Prediction

```
POST /api/predict/tenant-issue
```

**Request**:
```json
{
  "tenant_id": "123",
  "maintenance_requests": 3,
  "late_payments": 2,
  "missed_payments": 0,
  "total_payments": 12,
  "complaint_messages": 1,
  "months_as_tenant": 8,
  "credit_score": 680,
  "rent_amount": 1800
}
```

**Response**:
```json
{
  "tenant_id": "123",
  "prediction": {
    "issue": "Low risk",
    "confidence": 0.92,
    "risk_score": 0.35,
    "model_used": "ml_model"
  }
}
```

### 3. Anomaly Detection

```
POST /api/predict/anomaly
```

**Request**:
```json
{
  "property_id": "prop-456",
  "metrics": {
    "energy_usage": 8500,
    "water_usage": 4200,
    "maintenance_costs": 1200,
    "occupancy_rate": 95
  }
}
```

**Response**:
```json
{
  "property_id": "prop-456",
  "anomaly_detected": false,
  "model_used": "ml_model"
}
```

### 4. Financial Forecast

```
POST /api/predict/financial-forecast
```

**Request**:
```json
{
  "property_id": "prop-789",
  "months_ahead": 3,
  "historical_data": [
    {"month": "2023-10", "revenue": 25000, "expenses": 8000},
    {"month": "2023-11", "revenue": 26000, "expenses": 8200},
    {"month": "2023-12", "revenue": 27000, "expenses": 8100}
  ]
}
```

**Response**:
```json
{
  "property_id": "prop-789",
  "forecast": [
    {
      "month": 1,
      "projected_revenue": 27500,
      "confidence_interval": [24750, 30250]
    }
  ],
  "model_used": "trend_based"
}
```

---

## 🔄 Fallback Logic

The system gracefully handles ML API unavailability:

### When ML API is Down

1. Request to ML API times out or fails
2. Catch error in `predictiveModels.ts`
3. Log warning to console
4. Use rule-based fallback logic
5. Return prediction with `model_used: 'rule_based_fallback'`
6. Continue serving requests

**User Impact**: Minimal - predictions still work, just less accurate

### Rule-Based Fallback

**Tenant Churn**:
```typescript
Risk = (late_payments * 0.15) + (missed_payments * 0.25) + (frequent_issues ? 0.20 : 0)
```

**Anomaly Detection**:
```typescript
Anomaly = energy_usage > 10000 || occupancy_rate < 50
```

**Financial Forecast**:
```typescript
Forecast = avg(recent_3_months) * (1 + 0.02 * month)  // 2% growth
```

---

## 🎓 Next Steps

### Immediate (To Complete This Task)

1. **Install Python dependencies** (5 mins)
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Create models directory** (1 min)
   ```bash
   mkdir -p backend/src/predictive-analytics/models
   ```

3. **Train models** (15 mins)
   ```bash
   python3 tenant_behavior.py
   python3 anomaly_detection.py
   python3 financial_forecast.py
   ```

4. **Start ML API** (1 min)
   ```bash
   python3 api.py
   ```

5. **Test integration** (5 mins)
   ```bash
   curl http://localhost:5000/health
   ```

**Total Time**: ~30 minutes

### Future Enhancements

- Model retraining automation
- A/B testing for model versions
- Model performance monitoring
- Feature importance analysis
- Advanced ensemble models
- Real-time predictions
- Batch prediction endpoints

---

## 📚 Documentation

### Code Documentation

All functions are well-documented:
- ✅ Docstrings in Python code
- ✅ JSDoc comments in TypeScript
- ✅ Clear variable names
- ✅ Error handling

### API Documentation

- ✅ Endpoint descriptions in code
- ✅ Request/response examples
- ✅ Error handling documented

---

## ✅ Summary

### What's Ready

- ✅ Flask ML API server implementation
- ✅ Three prediction endpoints
- ✅ Training scripts for all models
- ✅ Backend integration code
- ✅ Fallback logic
- ✅ Error handling

### What's Needed

- ⏳ Python dependencies installation
- ⏳ Model training (requires data)
- ⏳ ML API server startup
- ⏳ Integration testing

**Estimated Time to Complete**: ~30-60 minutes

---

**Created**: 2024-01-06  
**Status**: 🟡 Ready for Setup  
**Next Action**: Install Python dependencies and train models
