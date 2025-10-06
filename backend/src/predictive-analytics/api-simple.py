"""
PropertyFlow AI - Simple ML API Server (No NumPy)
Flask API for serving predictions with rule-based fallbacks
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'models_loaded': [],
        'mode': 'rule_based_only'
    })

@app.route('/api/predict/tenant-issue', methods=['POST'])
def predict_tenant_issue():
    """
    Predict tenant issues based on behavior (Rule-based fallback)
    """
    try:
        data = request.json
        
        # Validate input
        required_fields = ['tenant_id', 'maintenance_requests', 'late_payments']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Rule-based prediction
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
    Detect anomalies in property metrics (Rule-based)
    """
    try:
        data = request.json
        
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
    Forecast financial metrics (Trend-based)
    """
    try:
        data = request.json
        months_ahead = data.get('months_ahead', 3)
        
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

if __name__ == '__main__':
    logger.info("Starting ML API in rule-based mode (no ML models)")
    logger.info("All predictions will use fallback logic")
    
    # Run Flask app
    port = int(os.environ.get('ML_API_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
