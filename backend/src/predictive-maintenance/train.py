import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report
from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectKBest, f_classif
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

def load_data(engine):
    query = """
    SELECT
        a.id as appliance_id,
        a."purchaseDate",
        a."lastMaintenanceDate",
        a.type,
        a.brand,
        a.model,
        a."warrantyEndDate",
        u."propertyId",
        p.address,
        COUNT(mr.id) as maintenance_count,
        COUNT(CASE WHEN mr.status = 'COMPLETED' THEN 1 END) as completed_maintenance_count,
        COUNT(CASE WHEN mr.priority = 'HIGH' OR mr.priority = 'CRITICAL' THEN 1 END) as high_priority_maintenance_count,
        AVG(CASE WHEN mr."estimatedCost" > 0 THEN mr."estimatedCost" END) as avg_maintenance_cost,
        MAX(mr."completionDate") as last_maintenance_completion,
        CASE
            WHEN MAX(mr.status) = 'COMPLETED' AND (CURRENT_DATE - MAX(mr."completionDate")) < 365 THEN 1
            ELSE 0
        END as failed_within_last_year,
        CASE
            WHEN a."warrantyEndDate" IS NOT NULL AND a."warrantyEndDate" < CURRENT_DATE THEN 1
            ELSE 0
        END as warranty_expired,
        EXTRACT(YEAR FROM a."purchaseDate") as purchase_year,
        EXTRACT(MONTH FROM a."purchaseDate") as purchase_month
    FROM "Appliance" a
    LEFT JOIN "Unit" u ON a."unitId" = u.id
    LEFT JOIN "Property" p ON u."propertyId" = p.id
    LEFT JOIN "MaintenanceRequest" mr ON u.id = mr."unitId"
    GROUP BY a.id, a."purchaseDate", a."lastMaintenanceDate", a.type, a.brand, a.model, a."warrantyEndDate", u."propertyId", p.address
    """
    df = pd.read_sql(query, engine)
    return df

def preprocess_data(df):
    # Convert dates
    df['purchaseDate'] = pd.to_datetime(df['purchaseDate'], errors='coerce')
    df['lastMaintenanceDate'] = pd.to_datetime(df['lastMaintenanceDate'], errors='coerce')
    df['last_maintenance_completion'] = pd.to_datetime(df['last_maintenance_completion'], errors='coerce')
    df['warrantyEndDate'] = pd.to_datetime(df['warrantyEndDate'], errors='coerce')

    # Calculate age and time features
    current_date = pd.to_datetime('now')
    df['age_years'] = (current_date - df['purchaseDate']).dt.days / 365.25
    df['age_months'] = (current_date - df['purchaseDate']).dt.days / 30.44
    df['time_since_last_maintenance_days'] = (current_date - df['lastMaintenanceDate']).dt.days
    df['time_since_last_maintenance_months'] = (current_date - df['lastMaintenanceDate']).dt.days / 30.44
    df['days_since_last_completion'] = (current_date - df['last_maintenance_completion']).dt.days
    df['warranty_remaining_days'] = (df['warrantyEndDate'] - current_date).dt.days

    # Maintenance frequency features
    df['maintenance_frequency_per_year'] = df['maintenance_count'] / df['age_years'].clip(lower=0.1)
    df['high_priority_ratio'] = df['high_priority_maintenance_count'] / df['maintenance_count'].clip(lower=1)

    # Cost-related features
    df['avg_maintenance_cost'] = df['avg_maintenance_cost'].fillna(0)
    df['cost_per_maintenance'] = df['avg_maintenance_cost'] / df['maintenance_count'].clip(lower=1)

    # Categorical encoding
    le_brand = LabelEncoder()
    df['brand_encoded'] = le_brand.fit_transform(df['brand'].fillna('Unknown'))

    le_model = LabelEncoder()
    df['model_encoded'] = le_model.fit_transform(df['model'].fillna('Unknown'))

    # One-hot encoding for type
    df = pd.get_dummies(df, columns=['type'], prefix='type', drop_first=True)

    # Drop unnecessary columns
    columns_to_drop = [
        'appliance_id', 'purchaseDate', 'lastMaintenanceDate', 'last_maintenance_completion',
        'warrantyEndDate', 'brand', 'model', 'propertyId', 'address', 'purchase_year', 'purchase_month'
    ]
    df.drop(columns=[col for col in columns_to_drop if col in df.columns], axis=1, inplace=True)

    # Handle missing values
    df.fillna({
        'age_years': 0,
        'age_months': 0,
        'time_since_last_maintenance_days': 365,
        'time_since_last_maintenance_months': 12,
        'days_since_last_completion': 365,
        'warranty_remaining_days': -365,
        'maintenance_frequency_per_year': 0,
        'high_priority_ratio': 0,
        'avg_maintenance_cost': 0,
        'cost_per_maintenance': 0,
        'brand_encoded': 0,
        'model_encoded': 0
    }, inplace=True)

    return df

def train_model():
    db_url = get_db_connection_url()
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")

    engine = create_engine(db_url)

    print("Loading data from database...")
    df = load_data(engine)
    print(f"Loaded {len(df)} records")

    print("Preprocessing data...")
    df = preprocess_data(df)
    print(f"Processed data shape: {df.shape}")

    # Check class distribution
    print("Class distribution:")
    print(df['failed_within_last_year'].value_counts(normalize=True))

    X = df.drop('failed_within_last_year', axis=1)
    y = df['failed_within_last_year']

    # Handle class imbalance if needed
    if y.value_counts()[0] / len(y) > 0.7:  # If majority class > 70%
        print("Applying SMOTE for class imbalance...")
        smote = SMOTE(random_state=42)
        X, y = smote.fit_resample(X, y)
        print(f"After SMOTE: {X.shape}, class distribution: {y.value_counts(normalize=True)}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Define models to try
    models = {
        'RandomForest': {
            'model': RandomForestClassifier(random_state=42),
            'params': {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
        },
        'GradientBoosting': {
            'model': GradientBoostingClassifier(random_state=42),
            'params': {
                'n_estimators': [100, 200],
                'learning_rate': [0.01, 0.1, 0.2],
                'max_depth': [3, 5, 7]
            }
        },
        'LogisticRegression': {
            'model': LogisticRegression(random_state=42, max_iter=1000),
            'params': {
                'C': [0.1, 1, 10],
                'penalty': ['l1', 'l2']
            }
        }
    }

    best_model = None
    best_score = 0
    best_model_name = ""

    print("\nTraining and evaluating models...")
    for name, model_config in models.items():
        print(f"\nTraining {name}...")

        # Create pipeline with feature selection
        pipeline = ImbPipeline([
            ('scaler', StandardScaler()),
            ('selector', SelectKBest(score_func=f_classif, k='all')),
            ('classifier', model_config['model'])
        ])

        # Update parameter names for pipeline
        pipeline_params = {f'classifier__{k}': v for k, v in model_config['params'].items()}

        # Grid search with cross-validation
        grid_search = GridSearchCV(
            pipeline,
            pipeline_params,
            cv=5,
            scoring='f1',
            n_jobs=-1,
            verbose=1
        )

        try:
            grid_search.fit(X_train, y_train)

            # Evaluate on test set
            y_pred = grid_search.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred)
            recall = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            roc_auc = roc_auc_score(y_test, grid_search.predict_proba(X_test)[:, 1])

            print(f"{name} Results:")
            print(f"  Best parameters: {grid_search.best_params_}")
            print(".4f")
            print(".4f")
            print(".4f")
            print(".4f")
            print(".4f")

            # Check if this model is better (prioritize F1 score for imbalanced data)
            if f1 > best_score:
                best_score = f1
                best_model = grid_search.best_estimator_
                best_model_name = name

        except Exception as e:
            print(f"Error training {name}: {e}")
            continue

    if best_model is None:
        print("No model trained successfully, using fallback RandomForest")
        best_model = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
        ])
        best_model.fit(X_train, y_train)
        best_model_name = "RandomForest_Fallback"

    # Final evaluation
    y_pred = best_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    print("
Best Model:", best_model_name)
    print(".4f")
    print(".4f")
    print(".4f")
    print(".4f")

    # Save the trained model and feature information
    model_data = {
        'model': best_model,
        'feature_names': list(X.columns),
        'model_name': best_model_name,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1
    }

    joblib.dump(model_data, 'predictive_maintenance_model.pkl')
    print("Model saved to predictive_maintenance_model.pkl")

    # Record performance
    performance_data = {
        'modelName': f'predictive_maintenance_{best_model_name.lower()}',
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1Score': f1,
        'version': '2.0.0',
        'datasetInfo': f'Enhanced dataset with {len(df)} records, {len(X.columns)} features',
        'notes': f'Trained with {best_model_name}, achieved {accuracy:.4f} accuracy, {f1:.4f} F1 score'
    }

    try:
        requests.post('http://localhost:5000/api/model-performance', json=performance_data)
        print("Performance metrics recorded successfully")
    except Exception as e:
        print(f"Could not record model performance: {e}")

    return best_model_name, accuracy, f1


if __name__ == '__main__':
    train_model()
