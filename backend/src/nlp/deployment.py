import os
import boto3
from botocore.exceptions import NoCredentialsError

def upload_to_s3(local_file, bucket, s3_file):
    """Upload a file to an S3 bucket."""
    s3 = boto3.client('s3')
    try:
        s3.upload_file(local_file, bucket, s3_file)
        print(f"Upload Successful: {s3_file}")
        return True
    except FileNotFoundError:
        print("The file was not found")
        return False
    except NoCredentialsError:
        print("Credentials not available")
        return False

def create_sagemaker_endpoint(endpoint_name, model_data_url, instance_type, initial_instance_count):
    """Create a SageMaker endpoint."""
    sagemaker = boto3.client('sagemaker')

    # Create model
    sagemaker.create_model(
        ModelName=endpoint_name,
        PrimaryContainer={
            'Image': 'your-ecr-image-uri', # Replace with your ECR image URI
            'ModelDataUrl': model_data_url,
        },
        ExecutionRoleArn='your-sagemaker-execution-role-arn' # Replace with your SageMaker execution role ARN
    )

    # Create endpoint configuration
    sagemaker.create_endpoint_config(
        EndpointConfigName=endpoint_name,
        ProductionVariants=[
            {
                'VariantName': 'AllTraffic',
                'ModelName': endpoint_name,
                'InitialInstanceCount': initial_instance_count,
                'InstanceType': instance_type,
            },
        ]
    )

    # Create endpoint
    sagemaker.create_endpoint(
        EndpointName=endpoint_name,
        EndpointConfigName=endpoint_name
    )

    print(f"Endpoint {endpoint_name} created successfully.")

if __name__ == "__main__":
    # Example usage:
    # This assumes you have a packaged model ready for deployment.
    
    # Upload model to S3
    # uploaded = upload_to_s3('path/to/your/model.tar.gz', 'your-s3-bucket', 'models/model.tar.gz')
    
    # if uploaded:
    #     model_data_url = 's3://your-s3-bucket/models/model.tar.gz'
    #     endpoint_name = 'your-endpoint-name'
    #     instance_type = 'ml.t2.medium'
    #     initial_instance_count = 1
    #     create_sagemaker_endpoint(endpoint_name, model_data_url, instance_type, initial_instance_count)
