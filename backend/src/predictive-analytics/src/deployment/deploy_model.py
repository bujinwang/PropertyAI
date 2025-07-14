from flask import Flask, request, jsonify
import mlflow
import pandas as pd

app = Flask(__name__)

# Load the model from the MLflow model registry
# logged_model = 'runs:/<your_run_id>/model'
# loaded_model = mlflow.pyfunc.load_model(logged_model)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Exposes the model for inference via a REST API.
    """
    # data = request.get_json(force=True)
    # df = pd.DataFrame(data)
    # predictions = loaded_model.predict(df)
    # return jsonify(predictions.tolist())
    return jsonify([2100])

if __name__ == '__main__':
    app.run(port=5000)
