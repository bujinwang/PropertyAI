# Predictive Analytics Framework Guide

This guide provides a comprehensive overview of the predictive analytics framework, including its architecture, components, and usage.

## Architecture

The framework is designed to be modular and extensible, following a standard machine learning pipeline structure. The main components are:

- **Data Ingestion**: Scripts for ingesting data from various sources like CSV files and SQL databases.
- **Preprocessing**: Modules for data cleaning, transformation, and feature engineering.
- **Training**: Scripts for training machine learning models.
- **Evaluation**: Modules for evaluating model performance.
- **Deployment**: Scripts and configuration for deploying models as REST APIs.

## Usage

### 1. Data Ingestion

- Place your raw data in the `data/raw` directory.
- Configure your data sources in `config/config.yml`.
- Use the `ingest_csv` or `ingest_sql` functions to load your data.

### 2. Preprocessing

- Use the functions in the `preprocessing` directory to clean and transform your data.
- Use the functions in the `feature_engineering` directory to create new features.

### 3. Training

- Use the `train_model` function to train your model.
- The trained model and its metrics will be logged with MLflow.

### 4. Evaluation

- Use the `evaluate_classification_model` function to evaluate your model's performance.

### 5. Deployment

- Use the `deploy_model.py` script to deploy your model as a REST API.
- The API will be available at `http://localhost:5000/predict`.
