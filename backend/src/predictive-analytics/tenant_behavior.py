import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib
import requests
from sqlalchemy import create_engine
import os
import warnings
warnings.filterwarnings('ignore')

def get_db_connection_url():
    return os.environ.get('DATABASE_URL')

def load_tenant_data(engine):
    """Load tenant data for behavior prediction"""
    query = """
    SELECT
        t.id as tenant_id,
        t."createdAt" as tenant_since,
        t."moveInDate",
        t."moveOutDate",
        t.employment_status,
        t.income_range,
        t.credit_score,
        p.id as property_id,
        p.address,
        u.id as unit_id,
        u.rent_amount,
        u.bedrooms,
        u.bathrooms,

        -- Payment history
        COUNT(pay.id) as total_payments,
        COUNT(CASE WHEN pay.status = 'LATE' THEN 1 END) as late_payments,
        COUNT(CASE WHEN pay.status = 'MISSED' THEN 1 END) as missed_payments,
        AVG(CASE WHEN pay.amount > 0 THEN pay.amount END) as avg_payment_amount,
        MAX(pay."dueDate") as last_payment_date,

        -- Maintenance requests
        COUNT(mr.id) as maintenance_requests,
        COUNT(CASE WHEN mr.priority = 'HIGH' OR mr.priority = 'CRITICAL' THEN 1 END) as urgent_maintenance,

        -- Lease information
        l."startDate" as lease_start,
        l."endDate" as lease_end,
        l.rent_amount as lease_rent,

        -- Communication
        COUNT(msg.id) as total_messages,
        COUNT(CASE WHEN msg.type = 'COMPLAINT' THEN 1 END) as complaint_messages,

        -- Target: Churn prediction (tenant left within last year)
        CASE
            WHEN t."moveOutDate" IS NOT NULL
                 AND t."moveOutDate" >= CURRENT_DATE - INTERVAL '1 year'
            THEN 1
            ELSE 0
        END as churned_last_year

    FROM "Tenant" t
    LEFT JOIN "Unit" u ON t."unitId" = u.id
    LEFT JOIN "Property" p ON u."propertyId" = p.id
    LEFT JOIN "Lease" l ON t.id = l."tenantId" AND l.status = 'ACTIVE'
    LEFT JOIN "Payment" pay ON t.id = pay."tenantId"
    LEFT JOIN "MaintenanceRequest" mr ON u.id = mr."unitId"
    LEFT JOIN "Message" msg ON t.id = msg."tenantId"
    GROUP BY t.id, t."createdAt", t."moveInDate", t."moveOutDate", t.employment_status,
             t.income_range, t.credit_score, p.id, p.address, u.id, u.rent_amount,
             u.bedrooms, u.bathrooms, l."startDate", l."endDate", l.rent_amount
    """
    df = pd.read_sql(query, engine)
    return df

def preprocess_tenant_data(df):
    """Preprocess tenant data for behavior prediction"""
    # Convert dates
    df['tenant_since'] = pd.to_datetime(df['tenant_since'], errors='coerce')
    df['moveInDate'] = pd.to_datetime(df['moveInDate'], errors='coerce')
    df['moveOutDate'] = pd.to_datetime(df['moveOutDate'], errors='coerce')
    df['lease_start'] = pd.to_datetime(df['lease_start'], errors='coerce')
    df['lease_end'] = pd.to_datetime(df['lease_end'], errors='coerce')
    df['last_payment_date'] = pd.to_datetime(df['last_payment_date'], errors='coerce')

    current_date = pd.to_datetime('now')

    # Calculate tenure and time features
    df['tenure_days'] = (current_date - df['moveInDate']).dt.days
    df['tenure_months'] = df['tenure_days'] / 30.44
    df['days_since_last_payment'] = (current_date - df['last_payment_date']).dt.days
    df['lease_remaining_days'] = (df['lease_end'] - current_date).dt.days

    # Payment behavior features
    df['late_payment_ratio'] = df['late_payments'] / df['total_payments'].clip(lower=1)
    df['missed_payment_ratio'] = df['missed_payments'] / df['total_payments'].clip(lower=1)
    df['payment_consistency'] = 1 - (df['late_payments'] + df['missed_payments']) / df['total_payments'].clip(lower=1)

    # Maintenance behavior
    df['maintenance_per_month'] = df['maintenance_requests'] / df['tenure_months'].clip(lower=1)
    df['urgent_maintenance_ratio'] = df['urgent_maintenance'] / df['maintenance_requests'].clip(lower=1)

    # Communication patterns
    df['messages_per_month'] = df['total_messages'] / df['tenure_months'].clip(lower=1)
    df['complaint_ratio'] = df['complaint_messages'] / df['total_messages'].clip(lower=1)

    # Financial features
    df['rent_to_income_ratio'] = df['rent_amount'] / df['income_range'].clip(lower=1000)

    # Encode categorical variables
    le_employment = LabelEncoder()
    df['employment_encoded'] = le_employment.fit_transform(df['employment_status'].fillna('Unknown'))

    le_income = LabelEncoder()
    df['income_encoded'] = le_income.fit_transform(df['income_range'].fillna('Unknown'))

    # Handle missing values
    df.fillna({
        'tenure_days': 0,
        'tenure_months': 0,
        'days_since_last_payment': 30,
        'lease_remaining_days': 365,
        'late_payment_ratio': 0,
        'missed_payment_ratio': 0,
        'payment_consistency': 1,
        'maintenance_per_month': 0,
        'urgent_maintenance_ratio': 0,
        'messages_per_month': 0,
        'complaint_ratio': 0,
        'rent_to_income_ratio': 0,
        'credit_score': 600,
        'employment_encoded': 0,
        'income_encoded': 0
    }, inplace=True)

    return df

def train_tenant_behavior_model():
    """Train tenant behavior prediction model"""
    db_url = get_db_connection_url()
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")

    engine = create_engine(db_url)

    print("Loading tenant data...")
    df = load_tenant_data(engine)
    print(f"Loaded {len(df)} tenant records")

    print("Preprocessing data...")
    df_processed = preprocess_tenant_data(df)
    print(f"Processed data shape: {df_processed.shape}")

    # Check class distribution
    print("Churn distribution:")
    print(df_processed['churned_last_year'].value_counts(normalize=True))

    # Prepare features
    feature_cols = [
        'tenure_days', 'tenure_months', 'days_since_last_payment', 'lease_remaining_days',
        'late_payment_ratio', 'missed_payment_ratio', 'payment_consistency',
        'maintenance_per_month', 'urgent_maintenance_ratio',
        'messages_per_month', 'complaint_ratio',
        'rent_to_income_ratio', 'credit_score', 'rent_amount',
        'bedrooms', 'bathrooms', 'employment_encoded', 'income_encoded'
    ]

    X = df_processed[feature_cols]
    y = df_processed['churned_last_year']

    # Handle class imbalance
    if y.value_counts()[1] / len(y) < 0.3:  # If minority class < 30%
        print("Applying SMOTE for class imbalance...")
        smote = SMOTE(random_state=42)
        X, y = smote.fit_resample(X, y)
        print(f"After SMOTE: {X.shape}, class distribution: {y.value_counts(normalize=True)}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Train models
    models = {
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
        'GradientBoosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
        'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000)
    }

    best_model = None
    best_score = 0
    best_model_name = ""

    print("\nTraining models...")
    for name, model in models.items():
        print(f"Training {name}...")

        pipeline = ImbPipeline([
            ('scaler', StandardScaler()),
            ('classifier', model)
        ])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, pipeline.predict_proba(X_test)[:, 1])

        print(f"{name} Results:")
        print(".4f")
        print(".4f")
        print(".4f")
        print(".4f")
        print(".4f")

        if f1 > best_score:
            best_score = f1
            best_model = pipeline
            best_model_name = name

    print(f"\nBest model: {best_model_name} with F1: {best_score:.4f}")

    # Save the model
    model_data = {
        'model': best_model,
        'feature_names': feature_cols,
        'model_name': best_model_name,
        'f1_score': best_score,
        'training_date': pd.to_datetime('now').isoformat()
    }

    joblib.dump(model_data, 'tenant_behavior_model.pkl')
    print("Tenant behavior model saved!")

    # Record performance
    performance_data = {
        'modelName': f'tenant_behavior_{best_model_name.lower()}',
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1Score': f1,
        'version': '1.0.0',
        'datasetInfo': f'Tenant data with {len(df_processed)} records',
        'notes': f'Tenant churn prediction model with F1 {best_score:.4f}'
    }

    try:
        requests.post('http://localhost:5000/api/model-performance', json=performance_data)
        print("Performance metrics recorded successfully")
    except Exception as e:
        print(f"Could not record model performance: {e}")

    return best_model_name, best_score

def predict_tenant_behavior(features):
    """Predict tenant behavior using trained model"""
    model_data = joblib.load('tenant_behavior_model.pkl')
    model = model_data['model']
    feature_names = model_data['feature_names']

    # Prepare input features
    feature_df = pd.DataFrame([features])

    # Ensure all required features are present
    for col in feature_names:
        if col not in feature_df.columns:
            feature_df[col] = 0

    feature_df = feature_df[feature_names]

    # Make prediction
    prediction = model.predict(feature_df)
    probability = model.predict_proba(feature_df)

    return {
        'churn_prediction': int(prediction[0]),
        'churn_probability': float(probability[0][1]),
        'risk_level': 'high' if probability[0][1] > 0.7 else 'medium' if probability[0][1] > 0.4 else 'low',
        'model_used': model_data['model_name']
    }

if __name__ == '__main__':
    train_tenant_behavior_model()