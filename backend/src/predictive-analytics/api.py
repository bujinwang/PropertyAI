"""
PropertyFlow AI - ML Model API Server
Flask API for serving predictive models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Model paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
TENANT_BEHAVIOR_MODEL = os.path.join(MODEL_DIR, 'tenant_behavior_model.pkl')
ANOMALY_DETECTION_MODEL = os.path.join(MODEL_DIR, 'anomaly_detection_model.pkl')
FINANCIAL_FORECAST_MODEL = os.path.join(MODEL_DIR, 'financial_forecast_model.pkl')

# Load models on startup (if they exist)
models = {}

def load_models():
    """Load all available models"""
    global models
    
    try:
        if os.path.exists(TENANT_BEHAVIOR_MODEL):
            models['tenant_behavior'] = joblib.load(TENANT_BEHAVIOR_MODEL)
            logger.info("Loaded tenant behavior model")
        else:
            logger.warning(f"Tenant behavior model not found at {TENANT_BEHAVIOR_MODEL}")
            
        if os.path.exists(ANOMALY_DETECTION_MODEL):
            models['anomaly_detection'] = joblib.load(ANOMALY_DETECTION_MODEL)
            logger.info("Loaded anomaly detection model")
            
        if os.path.exists(FINANCIAL_FORECAST_MODEL):
            models['financial_forecast'] = joblib.load(FINANCIAL_FORECAST_MODEL)
            logger.info("Loaded financial forecast model")
            
    except Exception as e:
        logger.error(f"Error loading models: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'models_loaded': list(models.keys())
    })

@app.route('/api/predict/tenant-issue', methods=['POST'])
def predict_tenant_issue():
    """
    Predict tenant issues based on behavior
    
    Request body:
    {
        "tenant_id": "string",
        "maintenance_requests": number,
        "late_payments": number,
        "missed_payments": number,
        "total_payments": number,
        "complaint_messages": number,
        "months_as_tenant": number,
        "credit_score": number,
        "rent_amount": number
    }
    """
    try:
        data = request.json
        
        # Validate input
        required_fields = ['tenant_id', 'maintenance_requests', 'late_payments']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # If model is loaded, use it
        if 'tenant_behavior' in models:
            # Prepare features for the model
            features = prepare_tenant_features(data)
            prediction = models['tenant_behavior'].predict(features)
            probability = models['tenant_behavior'].predict_proba(features)
            
            return jsonify({
                'tenant_id': data['tenant_id'],
                'prediction': {
                    'issue': 'High risk of lease termination' if prediction[0] == 1 else 'Low risk',
                    'confidence': float(max(probability[0])),
                    'risk_score': float(probability[0][1]),  # Probability of churn
                    'model_used': 'ml_model'
                }
            })
        else:
            # Fallback to rule-based prediction
            late_payments = data.get('late_payments', 0)
            missed_payments = data.get('missed_payments', 0)
            maintenance_requests = data.get('maintenance_requests', 0)
            
            risk_score = 0.0
            
            # Calculate risk score
            if late_payments > 0:
                risk_score += late_payments * 0.15
            if missed_payments > 0:
                risk_score += missed_payments * 0.25
            if maintenance_requests > 5:
                risk_score += 0.20
            
            risk_score = min(risk_score, 1.0)
            
            return jsonify({
                'tenant_id': data['tenant_id'],
                'prediction': {
                    'issue': 'High risk of lease termination' if risk_score > 0.5 else 'Low risk',
                    'confidence': 0.85 if risk_score > 0.5 else 0.95,
                    'risk_score': risk_score,
                    'model_used': 'rule_based'
                }
            })
            
    except Exception as e:
        logger.error(f"Error in tenant issue prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/anomaly', methods=['POST'])
def detect_anomaly():
    """
    Detect anomalies in property metrics
    
    Request body:
    {
        "property_id": "string",
        "metrics": {
            "energy_usage": number,
            "water_usage": number,
            "maintenance_costs": number,
            "occupancy_rate": number
        }
    }
    """
    try:
        data = request.json
        
        if 'anomaly_detection' in models:
            # Use ML model
            features = prepare_anomaly_features(data)
            prediction = models['anomaly_detection'].predict(features)
            
            return jsonify({
                'property_id': data['property_id'],
                'anomaly_detected': bool(prediction[0] == -1),
                'model_used': 'ml_model'
            })
        else:
            # Simple threshold-based detection
            metrics = data.get('metrics', {})
            anomaly = False
            
            # Check for unusual values
            if metrics.get('energy_usage', 0) > 10000:
                anomaly = True
            if metrics.get('occupancy_rate', 100) < 50:
                anomaly = True
                
            return jsonify({
                'property_id': data['property_id'],
                'anomaly_detected': anomaly,
                'model_used': 'rule_based'
            })
            
    except Exception as e:
        logger.error(f"Error in anomaly detection: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/financial-forecast', methods=['POST'])
def financial_forecast():
    """
    Forecast financial metrics
    
    Request body:
    {
        "property_id": "string",
        "months_ahead": number,
        "historical_data": [{
            "month": "string",
            "revenue": number,
            "expenses": number
        }]
    }
    """
    try:
        data = request.json
        months_ahead = data.get('months_ahead', 3)
        
        if 'financial_forecast' in models:
            # Use ML model for forecasting
            # This would require preparing time series data
            return jsonify({
                'property_id': data['property_id'],
                'forecast': [],
                'model_used': 'ml_model',
                'message': 'ML forecasting not yet implemented'
            })
        else:
            # Simple trend-based forecast
            historical = data.get('historical_data', [])
            if len(historical) < 2:
                return jsonify({'error': 'Insufficient historical data'}), 400
                
            # Calculate simple trend
            recent_revenue = [h['revenue'] for h in historical[-3:]]
            avg_revenue = sum(recent_revenue) / len(recent_revenue)
            
            forecast = []
            for i in range(months_ahead):
                forecast.append({
                    'month': i + 1,
                    'projected_revenue': avg_revenue * (1 + 0.02 * i),  # 2% growth assumption
                    'confidence_interval': [avg_revenue * 0.9, avg_revenue * 1.1]
                })
            
            return jsonify({
                'property_id': data['property_id'],
                'forecast': forecast,
                'model_used': 'trend_based'
            })
            
    except Exception as e:
        logger.error(f"Error in financial forecast: {e}")
        return jsonify({'error': str(e)}), 500

def prepare_tenant_features(data):
    """Prepare features for tenant behavior model"""
    features = np.array([[
        data.get('maintenance_requests', 0),
        data.get('late_payments', 0),
        data.get('missed_payments', 0),
        data.get('total_payments', 0),
        data.get('complaint_messages', 0),
        data.get('months_as_tenant', 12),
        data.get('credit_score', 650) / 850,  # Normalize
        data.get('rent_amount', 1500) / 5000  # Normalize
    ]])
    return features

def prepare_anomaly_features(data):
    """Prepare features for anomaly detection model"""
    metrics = data.get('metrics', {})
    features = np.array([[
        metrics.get('energy_usage', 0),
        metrics.get('water_usage', 0),
        metrics.get('maintenance_costs', 0),
        metrics.get('occupancy_rate', 100) / 100
    ]])
    return features

if __name__ == '__main__':
    # Create models directory if it doesn't exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Load models on startup
    load_models()
    
    # Run Flask app
    port = int(os.environ.get('ML_API_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
