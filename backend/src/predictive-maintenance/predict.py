import joblib
import pandas as pd
import numpy as np
import sys
import json
from sklearn.preprocessing import LabelEncoder

def predict(features):
    # Load the model data
    model_data = joblib.load('predictive_maintenance_model.pkl')
    model = model_data['model']
    feature_names = model_data['feature_names']
    model_name = model_data.get('model_name', 'Unknown')

    # Convert input to DataFrame
    feature_df = pd.DataFrame([features])

    # Apply the same preprocessing as in training
    feature_df = preprocess_features(feature_df)

    # Ensure all expected features are present
    for col in feature_names:
        if col not in feature_df.columns:
            feature_df[col] = 0

    # Keep only the features the model was trained on, in the correct order
    feature_df = feature_df[feature_names]

    # Make prediction
    prediction = model.predict(feature_df)
    probability = model.predict_proba(feature_df)

    # Get feature importance if available
    feature_importance = {}
    if hasattr(model.named_steps['classifier'], 'feature_importances_'):
        importances = model.named_steps['classifier'].feature_importances_
        feature_importance = dict(zip(feature_names, importances))

    return {
        'prediction': int(prediction[0]),
        'probability': float(probability[0][1]),
        'confidence': float(max(probability[0])),
        'model_name': model_name,
        'feature_importance': feature_importance,
        'risk_level': 'high' if probability[0][1] > 0.7 else 'medium' if probability[0][1] > 0.4 else 'low'
    }

def preprocess_features(df):
    """Apply the same preprocessing as in training"""
    import pandas as pd
    from datetime import datetime

    # Convert dates if present
    date_columns = ['purchaseDate', 'lastMaintenanceDate', 'last_maintenance_completion', 'warrantyEndDate']
    for col in date_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')

    # Calculate age and time features
    current_date = pd.to_datetime('now')
    if 'purchaseDate' in df.columns and not df['purchaseDate'].isna().all():
        df['age_years'] = (current_date - df['purchaseDate']).dt.days / 365.25
        df['age_months'] = (current_date - df['purchaseDate']).dt.days / 30.44
    else:
        df['age_years'] = 5  # Default age
        df['age_months'] = 60

    if 'lastMaintenanceDate' in df.columns and not df['lastMaintenanceDate'].isna().all():
        df['time_since_last_maintenance_days'] = (current_date - df['lastMaintenanceDate']).dt.days
        df['time_since_last_maintenance_months'] = (current_date - df['lastMaintenanceDate']).dt.days / 30.44
    else:
        df['time_since_last_maintenance_days'] = 365
        df['time_since_last_maintenance_months'] = 12

    if 'last_maintenance_completion' in df.columns and not df['last_maintenance_completion'].isna().all():
        df['days_since_last_completion'] = (current_date - df['last_maintenance_completion']).dt.days
    else:
        df['days_since_last_completion'] = 365

    if 'warrantyEndDate' in df.columns and not df['warrantyEndDate'].isna().all():
        df['warranty_remaining_days'] = (df['warrantyEndDate'] - current_date).dt.days
    else:
        df['warranty_remaining_days'] = -365

    # Maintenance frequency features
    if 'maintenance_count' in df.columns and 'age_years' in df.columns:
        df['maintenance_frequency_per_year'] = df['maintenance_count'] / df['age_years'].clip(lower=0.1)
    else:
        df['maintenance_count'] = df.get('maintenance_count', 0)
        df['maintenance_frequency_per_year'] = df['maintenance_count'] / 5  # Default

    if 'high_priority_maintenance_count' in df.columns and 'maintenance_count' in df.columns:
        df['high_priority_ratio'] = df['high_priority_maintenance_count'] / df['maintenance_count'].clip(lower=1)
    else:
        df['high_priority_ratio'] = 0

    # Cost-related features
    if 'avg_maintenance_cost' in df.columns:
        df['avg_maintenance_cost'] = df['avg_maintenance_cost'].fillna(0)
        df['cost_per_maintenance'] = df['avg_maintenance_cost'] / df['maintenance_count'].clip(lower=1)
    else:
        df['avg_maintenance_cost'] = 0
        df['cost_per_maintenance'] = 0

    # Categorical encoding
    if 'brand' in df.columns:
        le_brand = LabelEncoder()
        df['brand_encoded'] = le_brand.fit_transform(df['brand'].fillna('Unknown'))
    else:
        df['brand_encoded'] = 0

    if 'model' in df.columns:
        le_model = LabelEncoder()
        df['model_encoded'] = le_model.fit_transform(df['model'].fillna('Unknown'))
    else:
        df['model_encoded'] = 0

    # One-hot encoding for type
    if 'type' in df.columns:
        df = pd.get_dummies(df, columns=['type'], prefix='type', drop_first=True)

    # Warranty expired flag
    if 'warrantyEndDate' in df.columns and not df['warrantyEndDate'].isna().all():
        df['warranty_expired'] = (df['warrantyEndDate'] < current_date).astype(int)
    else:
        df['warranty_expired'] = 0

    # Fill any remaining missing values
    df = df.fillna({
        'age_years': 5,
        'age_months': 60,
        'time_since_last_maintenance_days': 365,
        'time_since_last_maintenance_months': 12,
        'days_since_last_completion': 365,
        'warranty_remaining_days': -365,
        'maintenance_frequency_per_year': 0,
        'high_priority_ratio': 0,
        'avg_maintenance_cost': 0,
        'cost_per_maintenance': 0,
        'brand_encoded': 0,
        'model_encoded': 0,
        'warranty_expired': 0
    })

    return df

if __name__ == "__main__":
    input_features = json.loads(sys.argv[1])
    result = predict(input_features)
    print(json.dumps(result))
