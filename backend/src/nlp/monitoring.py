import boto3
import datetime

def get_sagemaker_metrics(endpoint_name, metric_name, start_time, end_time):
    """Get metrics from CloudWatch for a SageMaker endpoint."""
    cloudwatch = boto3.client('cloudwatch')

    response = cloudwatch.get_metric_statistics(
        Namespace='AWS/SageMaker',
        MetricName=metric_name,
        Dimensions=[
            {
                'Name': 'EndpointName',
                'Value': endpoint_name
            },
        ],
        StartTime=start_time,
        EndTime=end_time,
        Period=3600,
        Statistics=['Average', 'Sum', 'Minimum', 'Maximum'],
        Unit='Count'
    )

    return response['Datapoints']

if __name__ == "__main__":
    # Example usage:
    # endpoint_name = 'your-endpoint-name'
    # metric_name = 'Invocations' # e.g., Invocations, ModelLatency, OverheadLatency
    # end_time = datetime.datetime.utcnow()
    # start_time = end_time - datetime.timedelta(days=1)
    
    # datapoints = get_sagemaker_metrics(endpoint_name, metric_name, start_time, end_time)
    # for dp in datapoints:
    #     print(dp)
