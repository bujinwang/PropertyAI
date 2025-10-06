"""
PropertyFlow AI - Simple ML API Server
Flask API for serving churn and maintenance predictions with rule-based fallbacks
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import logging
import random

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
        'timestamp': datetime.now().isoformat(),
        'models_loaded': [],
        'mode': 'rule_based_only'
    })

@app.route('/predict/churn', methods=['POST'])
def predict_churn():
    """
    Predict tenant churn risk
    Expected input: {
        "propertyId": "prop-123",
        "tenantId": "tenant-456",
        "features": {
            "paymentHistory": [1200, 1200, 1150, 1200, 1100],
            "maintenanceRequests": 3,
            "leaseEndDate": "2024-12-31",
            "monthsInProperty": 18
        }
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        property_id = data.get('propertyId', 'unknown')
        tenant_id = data.get('tenantId', 'unknown')
        features = data.get('features', {})
        
        # Rule-based churn prediction
        payment_history = features.get('paymentHistory', [])
        maintenance_requests = features.get('maintenanceRequests', 0)
        months_in_property = features.get('monthsInProperty', 12)
        
        # Calculate risk factors
        risk_score = 0.0
        factors = []
        recommendations = []
        
        # Payment history analysis
        if len(payment_history) >= 3:
            recent_payments = payment_history[-3:]
            avg_payment = sum(recent_payments) / len(recent_payments)
            if min(recent_payments) < avg_payment * 0.9:
                risk_score += 0.25
                factors.append("Late or reduced payments in last 3 months")
                recommendations.append("Schedule payment discussion meeting")
        
        # Maintenance requests
        if maintenance_requests > 5:
            risk_score += 0.20
            factors.append("Multiple maintenance requests")
            recommendations.append("Address outstanding maintenance concerns")
        elif maintenance_requests > 3:
            risk_score += 0.10
            factors.append("Several maintenance requests")
        
        # Tenure analysis
        if months_in_property < 6:
            risk_score += 0.15
            factors.append("New tenant (less than 6 months)")
            recommendations.append("Conduct new tenant satisfaction survey")
        elif months_in_property > 24:
            risk_score -= 0.10
            factors.append("Long-term tenant")
        
        # Cap risk score
        risk_score = max(0.0, min(1.0, risk_score))
        
        # Determine risk level
        if risk_score >= 0.7:
            risk_level = "high"
            recommendations.append("Immediate retention action required")
        elif risk_score >= 0.4:
            risk_level = "medium"
            recommendations.append("Monitor situation closely")
        else:
            risk_level = "low"
        
        if not factors:
            factors.append("No significant risk factors detected")
        if not recommendations:
            recommendations.append("Continue standard tenant relations")
        
        return jsonify({
            'propertyId': property_id,
            'tenantId': tenant_id,
            'churnProbability': round(risk_score, 2),
            'riskLevel': risk_level,
            'factors': factors,
            'recommendations': recommendations,
            'modelUsed': 'rule_based',
            'timestamp': datetime.now().isoformat()
        })
            
    except Exception as e:
        logger.error(f"Error in churn prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict/maintenance', methods=['POST'])
def predict_maintenance():
    """
    Predict maintenance costs
    Expected input: {
        "propertyId": "prop-789",
        "features": {
            "propertyAge": 15,
            "lastMaintenanceCost": 3000,
            "systemAges": {
                "HVAC": 12,
                "Plumbing": 8,
                "Electrical": 10
            }
        }
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        property_id = data.get('propertyId', 'unknown')
        features = data.get('features', {})
        
        # Extract features
        property_age = features.get('propertyAge', 10)
        last_cost = features.get('lastMaintenanceCost', 2000)
        system_ages = features.get('systemAges', {})
        
        # Rule-based maintenance prediction
        base_cost = last_cost
        multiplier = 1.0
        insights = []
        breakdown = {}
        
        # Property age factor
        if property_age > 20:
            multiplier += 0.3
            insights.append("Property age over 20 years - expect higher costs")
        elif property_age > 10:
            multiplier += 0.15
            insights.append("Aging property - moderate cost increase expected")
        
        # System age analysis
        hvac_age = system_ages.get('HVAC', 10)
        plumbing_age = system_ages.get('Plumbing', 10)
        electrical_age = system_ages.get('Electrical', 10)
        
        # HVAC costs
        if hvac_age > 15:
            breakdown['HVAC'] = 3500
            insights.append("HVAC system nearing end of life - replacement may be needed")
        elif hvac_age > 10:
            breakdown['HVAC'] = 2000
            insights.append("HVAC system aging - increase preventive maintenance")
        else:
            breakdown['HVAC'] = 800
        
        # Plumbing costs
        if plumbing_age > 20:
            breakdown['Plumbing'] = 2500
            insights.append("Plumbing system very old - inspect for leaks")
        elif plumbing_age > 10:
            breakdown['Plumbing'] = 1500
        else:
            breakdown['Plumbing'] = 600
        
        # Electrical costs
        if electrical_age > 15:
            breakdown['Electrical'] = 2000
            insights.append("Electrical system aging - safety inspection recommended")
        elif electrical_age > 10:
            breakdown['Electrical'] = 1000
        else:
            breakdown['Electrical'] = 500
        
        # Calculate predicted cost
        predicted_cost = sum(breakdown.values())
        confidence = 0.80 if property_age > 15 else 0.85
        
        if not insights:
            insights.append("Property in good condition - routine maintenance expected")
        
        return jsonify({
            'propertyId': property_id,
            'predictedCost': predicted_cost,
            'confidence': confidence,
            'timeframe': 'next_quarter',
            'breakdown': breakdown,
            'insights': insights,
            'modelUsed': 'rule_based',
            'timestamp': datetime.now().isoformat()
        })
            
    except Exception as e:
        logger.error(f"Error in maintenance prediction: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting ML API in rule-based mode (no ML models)")
    logger.info("All predictions will use fallback logic")
    
    # Run Flask app
    port = int(os.environ.get('ML_API_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
