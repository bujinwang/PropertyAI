import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import pandas as pd

def load_data(data_path):
    """Load data from a CSV file."""
    return pd.read_csv(data_path)

def train_model(df, text_column, label_column):
    """Train a text classification model."""
    X_train, X_test, y_train, y_test = train_test_split(df[text_column], df[label_column], test_size=0.2, random_state=42)

    text_clf = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english')),
        ('clf', MultinomialNB()),
    ])

    with mlflow.start_run():
        text_clf.fit(X_train, y_train)

        predictions = text_clf.predict(X_test)

        accuracy = accuracy_score(y_test, predictions)
        precision = precision_score(y_test, predictions, average='weighted')
        recall = recall_score(y_test, predictions, average='weighted')
        f1 = f1_score(y_test, predictions, average='weighted')

        mlflow.log_param("text_column", text_column)
        mlflow.log_param("label_column", label_column)
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("precision", precision)
        mlflow.log_metric("recall", recall)
        mlflow.log_metric("f1_score", f1)

        mlflow.sklearn.log_model(text_clf, "text_classification_model")

        print(f"Accuracy: {accuracy}")
        print(f"Precision: {precision}")
        print(f"Recall: {recall}")
        print(f"F1 Score: {f1}")

if __name__ == "__main__":
    # Example usage:
    # Create a dummy CSV for testing
    data = {'text': ['this is a positive review', 'this is a negative review', 'this is neutral'],
            'label': ['positive', 'negative', 'neutral']}
    df = pd.DataFrame(data)
    df.to_csv('dummy_data.csv', index=False)

    df = load_data('dummy_data.csv')
    train_model(df, 'text', 'label')
