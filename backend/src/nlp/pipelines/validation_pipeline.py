import mlflow
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def load_data(data_path):
    """Load data from a CSV file."""
    return pd.read_csv(data_path)

def validate_model(df, text_column, label_column, model_uri):
    """Validate a trained model."""
    model = mlflow.sklearn.load_model(model_uri)

    X_test = df[text_column]
    y_test = df[label_column]

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(y_test, predictions, average='weighted')
    recall = recall_score(y_test, predictions, average='weighted')
    f1 = f1_score(y_test, predictions, average='weighted')

    print(f"Accuracy: {accuracy}")
    print(f"Precision: {precision}")
    print(f"Recall: {recall}")
    print(f"F1 Score: {f1}")

    return {"accuracy": accuracy, "precision": precision, "recall": recall, "f1_score": f1}

if __name__ == "__main__":
    # Example usage:
    # This assumes you have a trained model in MLflow.
    # You would typically get the model_uri from the MLflow UI or API.
    
    # Create a dummy CSV for testing
    data = {'text': ['this is a positive review', 'this is a negative review', 'this is neutral'],
            'label': ['positive', 'negative', 'neutral']}
    df = pd.DataFrame(data)
    df.to_csv('dummy_validation_data.csv', index=False)

    df = load_data('dummy_validation_data.csv')
    
    # You need to replace this with a real model URI from your MLflow server
    # For example: "runs:/<run_id>/text_classification_model"
    # model_uri = "runs:/.../text_classification_model" 
    # validate_model(df, 'text', 'label', model_uri)
