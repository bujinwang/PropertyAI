import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import joblib
import requests
from sqlalchemy import create_engine
import os
import warnings
warnings.filterwarnings('ignore')

def get_db_connection_url():
    return os.environ.get('DATABASE_URL')

def load_financial_data(engine):
    """Load financial data from database for forecasting"""
    query = """
    SELECT
        t.id,
        t."createdAt" as transaction_date,
        t.amount,
        t.type,
        t.category,
        t.description,
        p.id as property_id,
        p.address,
        DATE_TRUNC('month', t."createdAt") as month_year,
        EXTRACT(YEAR FROM t."createdAt") as year,
        EXTRACT(MONTH FROM t."createdAt") as month,
        CASE
            WHEN t.type = 'INCOME' THEN t.amount
            ELSE 0
        END as income_amount,
        CASE
            WHEN t.type = 'EXPENSE' THEN t.amount
            ELSE 0
        END as expense_amount
    FROM "Transaction" t
    LEFT JOIN "Property" p ON t."propertyId" = p.id
    WHERE t."createdAt" >= CURRENT_DATE - INTERVAL '2 years'
    ORDER BY t."createdAt"
    """
    df = pd.read_sql(query, engine)
    return df

def preprocess_financial_data(df):
    """Preprocess financial data for forecasting"""
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['month_year'] = pd.to_datetime(df['month_year'])

    # Aggregate by month and property
    monthly_data = df.groupby(['property_id', 'month_year']).agg({
        'income_amount': 'sum',
        'expense_amount': 'sum',
        'amount': 'count'  # transaction count
    }).reset_index()

    monthly_data.rename(columns={'amount': 'transaction_count'}, inplace=True)

    # Calculate net income
    monthly_data['net_income'] = monthly_data['income_amount'] - monthly_data['expense_amount']

    # Add time-based features
    monthly_data['month'] = monthly_data['month_year'].dt.month
    monthly_data['year'] = monthly_data['month_year'].dt.year
    monthly_data['quarter'] = monthly_data['month_year'].dt.quarter

    # Add lag features for time series
    monthly_data = monthly_data.sort_values(['property_id', 'month_year'])
    for lag in [1, 2, 3]:
        monthly_data[f'net_income_lag_{lag}'] = monthly_data.groupby('property_id')['net_income'].shift(lag)
        monthly_data[f'income_lag_{lag}'] = monthly_data.groupby('property_id')['income_amount'].shift(lag)
        monthly_data[f'expense_lag_{lag}'] = monthly_data.groupby('property_id')['expense_amount'].shift(lag)

    # Add rolling statistics
    monthly_data['net_income_rolling_mean_3'] = monthly_data.groupby('property_id')['net_income'].rolling(3).mean().reset_index(0, drop=True)
    monthly_data['net_income_rolling_std_3'] = monthly_data.groupby('property_id')['net_income'].rolling(3).std().reset_index(0, drop=True)

    # Fill missing values
    monthly_data.fillna(0, inplace=True)

    return monthly_data

def train_financial_forecast_model():
    """Train financial forecasting model"""
    db_url = get_db_connection_url()
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")

    engine = create_engine(db_url)

    print("Loading financial data...")
    df = load_financial_data(engine)
    print(f"Loaded {len(df)} transactions")

    print("Preprocessing data...")
    df_processed = preprocess_financial_data(df)
    print(f"Processed data shape: {df_processed.shape}")

    # Prepare features for forecasting
    feature_cols = [
        'month', 'year', 'quarter', 'transaction_count',
        'net_income_lag_1', 'net_income_lag_2', 'net_income_lag_3',
        'income_lag_1', 'income_lag_2', 'income_lag_3',
        'expense_lag_1', 'expense_lag_2', 'expense_lag_3',
        'net_income_rolling_mean_3', 'net_income_rolling_std_3'
    ]

    # Remove rows with missing target values (first few months)
    df_model = df_processed.dropna(subset=['net_income'])

    X = df_model[feature_cols]
    y = df_model['net_income']

    # Split data (use more recent data for testing)
    train_size = int(len(df_model) * 0.8)
    X_train = X[:train_size]
    X_test = X[train_size:]
    y_train = y[:train_size]
    y_test = y[train_size:]

    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples")

    # Try different models
    models = {
        'RandomForest': RandomForestRegressor(n_estimators=100, random_state=42),
        'GradientBoosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
        'LinearRegression': LinearRegression()
    }

    best_model = None
    best_score = float('inf')
    best_model_name = ""

    print("\nTraining models...")
    for name, model in models.items():
        print(f"Training {name}...")

        # Create pipeline
        from sklearn.pipeline import Pipeline
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('regressor', model)
        ])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)

        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)

        print(f"{name} Results:")
        print(".2f")
        print(".2f")
        print(".4f")

        if mae < best_score:
            best_score = mae
            best_model = pipeline
            best_model_name = name

    print(f"\nBest model: {best_model_name} with MAE: {best_score:.2f}")

    # Save the model
    model_data = {
        'model': best_model,
        'feature_names': feature_cols,
        'model_name': best_model_name,
        'mae': best_score,
        'training_date': pd.to_datetime('now').isoformat()
    }

    joblib.dump(model_data, 'financial_forecast_model.pkl')
    print("Financial forecast model saved!")

    # Record performance
    performance_data = {
        'modelName': f'financial_forecast_{best_model_name.lower()}',
        'accuracy': 1 - (best_score / y_test.mean()),  # Approximation of accuracy
        'precision': 0,  # Not applicable for regression
        'recall': 0,     # Not applicable for regression
        'f1Score': 0,    # Not applicable for regression
        'version': '1.0.0',
        'datasetInfo': f'Financial data with {len(df_model)} records',
        'notes': f'Financial forecasting model with MAE {best_score:.2f}'
    }

    try:
        requests.post('http://localhost:5000/api/model-performance', json=performance_data)
        print("Performance metrics recorded successfully")
    except Exception as e:
        print(f"Could not record model performance: {e}")

    return best_model_name, best_score

def forecast_financials(features):
    """Make financial forecast using trained model"""
    model_data = joblib.load('financial_forecast_model.pkl')
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

    return {
        'predicted_net_income': float(prediction[0]),
        'forecast_period': 'next_month',
        'confidence_level': 'medium',
        'model_used': model_data['model_name']
    }

if __name__ == '__main__':
    train_financial_forecast_model()