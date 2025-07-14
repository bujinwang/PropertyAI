import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def load_data(path):
    """Loads the repair cost data."""
    return pd.read_csv(path)

def preprocess_data(df):
    """Preprocesses the data for model training."""
    df['work_order_duration'] = (pd.to_datetime(df['work_order_completed_at']) - pd.to_datetime(df['work_order_created_at'])).dt.days
    df = pd.get_dummies(df, columns=['property_type', 'repair_priority'], drop_first=True)
    df.drop(['maintenance_request_id', 'repair_description', 'work_order_created_at', 'work_order_completed_at'], axis=1, inplace=True)
    df.fillna(0, inplace=True)
    return df

def train_model(df):
    """Trains the cost estimation model."""
    X = df.drop('actual_cost', axis=1)
    y = df['actual_cost']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model, X_test, y_test

def evaluate_model(model, X_test, y_test):
    """Evaluates the trained model."""
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"Mean Absolute Error: {mae}")
    print(f"R2 Score: {r2}")

def save_model(model, path):
    """Saves the trained model."""
    joblib.dump(model, path)
    print(f"Model saved to {path}")

def main():
    """Main function to train and save the model."""
    df = load_data("repair_costs.csv")
    df = preprocess_data(df)
    model, X_test, y_test = train_model(df)
    evaluate_model(model, X_test, y_test)
    save_model(model, "cost_estimation_model.pkl")

if __name__ == "__main__":
    main()
