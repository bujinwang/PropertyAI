import mlflow
import docker
import os

def package_model(model_uri, image_name):
    """Package a model into a Docker image."""
    
    # Create a Dockerfile
    dockerfile_content = f"""
    FROM python:3.8-slim
    RUN pip install mlflow
    RUN pip install gunicorn
    ENV MODEL_URI={model_uri}
    COPY . /app
    WORKDIR /app
    EXPOSE 8080
    CMD ["gunicorn", "-b", "0.0.0.0:8080", "mlflow.pyfunc.scoring_server.wsgi:app"]
    """
    
    with open("Dockerfile", "w") as f:
        f.write(dockerfile_content)
        
    client = docker.from_env()
    
    print(f"Building Docker image {image_name}...")
    client.images.build(path=".", tag=image_name)
    print(f"Docker image {image_name} built successfully.")
    
    # Clean up the Dockerfile
    os.remove("Dockerfile")

if __name__ == "__main__":
    # Example usage:
    # This assumes you have a trained model in MLflow.
    # You would typically get the model_uri from the MLflow UI or API.
    
    # You need to replace this with a real model URI from your MLflow server
    # For example: "runs:/<run_id>/text_classification_model"
    # model_uri = "runs:/.../text_classification_model"
    # image_name = "text-classification-model:latest"
    # package_model(model_uri, image_name)
