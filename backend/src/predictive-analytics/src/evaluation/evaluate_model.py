import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def evaluate_classification_model(y_true: pd.Series, y_pred: pd.Series) -> dict:
    """
    Evaluates a classification model.

    Args:
        y_true: The true labels.
        y_pred: The predicted labels.

    Returns:
        A dictionary containing the evaluation metrics.
    """
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='weighted')
    recall = recall_score(y_true, y_pred, average='weighted')
    f1 = f1_score(y_true, y_pred, average='weighted')

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }
