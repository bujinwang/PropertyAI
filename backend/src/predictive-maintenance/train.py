import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import requests
from sqlalchemy import create_engine
import os

def get_db_connection_url():
    return os.environ.get('DATABASE_URL')

def load_data(engine):
    query = """
    SELECT
        a.id as appliance_id,
        a."purchaseDate",
        a."lastMaintenanceDate",
        a.type,
        COUNT(mr.id) as maintenance_count,
        CASE
            WHEN MAX(mr.status) = 'COMPLETED' AND (CURRENT_DATE - MAX(mr."completionDate")) < 365 THEN 1
            ELSE 0
        END as failed_within_last_year
    FROM "Appliance" a
    LEFT JOIN "Unit" u ON a."unitId" = u.id
    LEFT JOIN "MaintenanceRequest" mr ON u.id = mr."unitId"
    GROUP BY a.id
    """
    df = pd.read_sql(query, engine)
    return df

def preprocess_data(df):
    df['purchaseDate'] = pd.to_datetime(df['purchaseDate'])
    df['lastMaintenanceDate'] = pd.to_datetime(df['lastMaintenanceDate'])
    
    df['age'] = (pd.to_datetime('now') - df['purchaseDate']).dt.days / 365.25
    df['time_since_last_maintenance'] = (pd.to_datetime('now') - df['lastMaintenanceDate']).dt.days
    
    df.drop(['appliance_id', 'purchaseDate', 'lastMaintenanceDate'], axis=1, inplace=True)
    
    df = pd.get_dummies(df, columns=['type'], drop_first=True)
    
    df.fillna(0, inplace=True)
    
    return df

def train_model():
    db_url = get_db_connection_url()
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")

    engine = create_engine(db_url)
    
    df = load_data(engine)
    df = preprocess_data(df)

    X = df.drop('failed_within_last_year', axis=1)
    y = df['failed_within_last_year']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    print(f"Model Accuracy: {accuracy}")
    print(f"Model Precision: {precision}")
    print(f"Model Recall: {recall}")
    print(f"Model F1 Score: {f1}")

    # Save the trained model
    joblib.dump(model, 'predictive_maintenance_model.pkl')

    # Record performance
    performance_data = {
        'modelName': 'predictive_maintenance_model',
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1Score': f1,
        'version': '1.0.0',
        'datasetInfo': 'Live data from database',
        'notes': 'Training run with real data'
    }
    try:
        requests.post('http://localhost:5000/api/model-performance', json=performance_data)
    except Exception as e:
        print(f"Could not record model performance: {e}")


if __name__ == '__main__':
    train_model()
