import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import mlflow
import mlflow.sklearn

def train_model(df: pd.DataFrame, target_column: str):
    """
    Trains a RandomForestClassifier model and logs the experiment with MLflow.

    Args:
        df: The input DataFrame.
        target_column: The name of the target variable column.
    """
    with mlflow.start_run():
        X = df.drop(target_column, axis=1)
        y = df[target_column]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        accuracy = model.score(X_test, y_test)
        mlflow.log_param("n_estimators", 100)
        mlflow.log_metric("accuracy", accuracy)
        mlflow.sklearn.log_model(model, "model")

        print(f"Model trained with accuracy: {accuracy}")
