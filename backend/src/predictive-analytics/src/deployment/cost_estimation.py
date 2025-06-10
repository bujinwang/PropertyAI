import joblib
import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the trained model
model = joblib.load('cost_estimation_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    """Predicts the cost of a repair."""
    data = request.get_json(force=True)
    df = pd.DataFrame(data, index=[0])
    df['work_order_duration'] = (pd.to_datetime(df['work_order_completed_at']) - pd.to_datetime(df['work_order_created_at'])).dt.days
    df = pd.get_dummies(df, columns=['property_type', 'repair_priority'], drop_first=True)
    df.drop(['maintenance_request_id', 'repair_description', 'work_order_created_at', 'work_order_completed_at'], axis=1, inplace=True)
    df.fillna(0, inplace=True)
    
    # Ensure all columns from training are present
    for col in model.feature_names_in_:
        if col not in df.columns:
            df[col] = 0
    
    prediction = model.predict(df)
    return jsonify({'estimated_cost': prediction[0]})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
