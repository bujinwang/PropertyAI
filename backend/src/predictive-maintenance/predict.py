import joblib
import pandas as pd
import sys
import json

def predict(features):
    model = joblib.load('predictive_maintenance_model.pkl')
    
    feature_df = pd.DataFrame([features])
    
    # Ensure columns are in the same order as during training
    # This is a simplified example; a more robust solution would save/load column order
    cols = ['age', 'maintenance_count', 'time_since_last_maintenance', 'type_REFRIGERATOR', 'type_OVEN', 'type_DISHWASHER']
    for col in cols:
        if col not in feature_df.columns:
            feature_df[col] = 0
    feature_df = feature_df[cols]

    prediction = model.predict(feature_df)
    probability = model.predict_proba(feature_df)
    
    return {
        'prediction': int(prediction[0]),
        'probability': float(probability[0][1])
    }

if __name__ == "__main__":
    input_features = json.loads(sys.argv[1])
    result = predict(input_features)
    print(json.dumps(result))
