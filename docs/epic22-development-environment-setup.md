# Epic 22 Development Environment Setup

## Overview

This document outlines the development environment setup required for Epic 22: AI-Driven Property Intelligence Platform. The environment must support advanced ML/AI development, real-time data processing, and scalable microservices architecture.

## Infrastructure Requirements

### Cloud Resources (AWS)
- **EC2 Instances**: 4 x t3.large for development (16 vCPU, 32GB RAM each)
- **GPU Instances**: 2 x p3.2xlarge for ML training (8 vCPU, 61GB RAM, V100 GPU each)
- **RDS PostgreSQL**: db.t3.large for development database
- **ElastiCache Redis**: cache.t3.micro for development caching
- **EKS Cluster**: 3-node development cluster for Kubernetes workloads
- **S3 Buckets**: For model artifacts, datasets, and logs

### Development Tools
- **IDE**: VS Code with remote development extensions
- **Version Control**: Git with GitHub Enterprise
- **CI/CD**: GitHub Actions with self-hosted runners
- **Container Registry**: Amazon ECR for Docker images
- **Monitoring**: DataDog for application and infrastructure monitoring

## Environment Configuration

### 1. Base Development Environment

#### Local Development Setup
```bash
# Clone repositories
git clone https://github.com/propertyai/platform.git
git clone https://github.com/propertyai/ml-models.git
git clone https://github.com/propertyai/infrastructure.git

# Install dependencies
cd platform && npm install
cd ../ml-models && pip install -r requirements.txt
cd ../infrastructure && terraform init
```

#### Docker Development Environment
```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: propertyai_dev
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mlflow:
    image: mlflow/mlflow:latest
    ports:
      - "5000:5000"
    environment:
      MLFLOW_BACKEND_STORE_URI: postgresql://developer:dev_password@postgres/mlflow
    depends_on:
      - postgres

  kubeflow:
    image: kubeflow/kubeflow:latest
    ports:
      - "8080:8080"
    environment:
      KUBEFLOW_USERNAME: developer
      KUBEFLOW_PASSWORD: kubeflow_password
```

### 2. ML/AI Development Environment

#### Python Environment Setup
```bash
# Create conda environment
conda create -n epic22-ml python=3.9
conda activate epic22-ml

# Install core ML libraries
pip install tensorflow==2.12.0
pip install torch==2.0.1
pip install scikit-learn==1.3.0
pip install xgboost==1.7.5
pip install mlflow==2.4.1
pip install kubeflow==1.8.1

# Install development tools
pip install jupyterlab
pip install black
pip install pytest
pip install pre-commit
```

#### GPU Setup for Local Development
```bash
# Install CUDA toolkit
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_520.61.05_linux.run
sudo sh cuda_11.8.0_520.61.05_linux.run

# Install cuDNN
wget https://developer.download.nvidia.com/compute/cudnn/8.6.0/local_installers/cudnn-linux-x86_64-8.6.0.163_cuda11.8-archive.tar.xz
tar -xvf cudnn-linux-x86_64-8.6.0.163_cuda11.8-archive.tar.xz
sudo cp cudnn-linux-x86_64-8.6.0.163_cuda11.8-archive/include/cudnn*.h /usr/local/cuda/include
sudo cp cudnn-linux-x86_64-8.6.0.163_cuda11.8-archive/lib/libcudnn* /usr/local/cuda/lib64
```

### 3. Kubernetes Development Environment

#### Local Kubernetes Setup (Kind)
```bash
# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.17.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/

# Create Kind cluster
kind create cluster --name epic22-dev --config kind-config.yaml

# Install Kubeflow
kubectl apply -k github.com/kubeflow/manifests/kfdef/kfctl_istio_dex/v1.1-branch/kfdef/
```

#### Kind Configuration
```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
  labels:
    gpu: "true"
- role: worker
- role: worker
```

### 4. Data Pipeline Setup

#### Apache Kafka Development Environment
```yaml
# docker-compose.kafka.yml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.3.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_INTERNAL:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka:29092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8081:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
    depends_on:
      - kafka
```

#### Elasticsearch Development Setup
```yaml
# docker-compose.elasticsearch.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

## Development Workflow Setup

### 1. Git Workflow Configuration
```bash
# Setup git hooks
pre-commit install
pre-commit run --all-files

# Configure git flow
git flow init
git checkout develop
git checkout -b feature/epic22-setup
```

### 2. CI/CD Pipeline Setup
```yaml
# .github/workflows/epic22-ci.yml
name: Epic 22 CI/CD

on:
  push:
    branches: [ develop, feature/epic22-* ]
  pull_request:
    branches: [ develop ]

jobs:
  test:
    runs-on: self-hosted
    steps:
    - uses: actions/checkout@v3
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    - name: Run tests
      run: pytest --cov=src --cov-report=xml
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  ml-test:
    runs-on: self-hosted
    steps:
    - uses: actions/checkout@v3
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    - name: Install ML dependencies
      run: pip install -r ml-requirements.txt
    - name: Run ML tests
      run: python -m pytest tests/ml/ -v
    - name: Validate models
      run: python scripts/validate_models.py
```

### 3. Monitoring and Logging Setup

#### Application Monitoring
```python
# monitoring.py
from datadog import initialize, statsd
from prometheus_client import start_http_server, Summary, Counter, Histogram

# Initialize DataDog
options = {
    'api_key': os.getenv('DD_API_KEY'),
    'app_key': os.getenv('DD_APP_KEY')
}
initialize(**options)

# Prometheus metrics
REQUEST_TIME = Summary('request_processing_seconds', 'Time spent processing request')
REQUEST_COUNT = Counter('request_total', 'Total number of requests')
MODEL_ACCURACY = Histogram('model_accuracy', 'Model prediction accuracy')
```

#### Infrastructure Monitoring
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'epic22-ml'
    static_configs:
      - targets: ['localhost:8000']
  - job_name: 'kubernetes'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__meta_kubernetes_node_name]
        target_label: node
```

## Security Configuration

### 1. Development Security Setup
```bash
# Generate SSH keys for secure access
ssh-keygen -t rsa -b 4096 -C "epic22-dev@company.com"

# Configure AWS CLI with MFA
aws configure sso

# Set up Vault for secrets management
vault server -dev
```

### 2. Access Control Setup
```yaml
# AWS IAM policy for developers
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "rds:DescribeDBInstances",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

## Testing Environment Setup

### 1. Unit Testing Framework
```python
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --cov=src --cov-report=html --cov-report=xml
markers =
    unit: Unit tests
    integration: Integration tests
    ml: Machine learning tests
    performance: Performance tests
```

### 2. ML Model Testing
```python
# tests/ml/test_model_accuracy.py
import pytest
from src.ml.models.predictive_model import PredictiveModel
from src.ml.utils.metrics import calculate_accuracy

class TestModelAccuracy:
    def setup_method(self):
        self.model = PredictiveModel()
        self.test_data = load_test_dataset()

    def test_model_loads_correctly(self):
        assert self.model.is_loaded()

    def test_prediction_accuracy_above_threshold(self):
        predictions = self.model.predict(self.test_data.features)
        accuracy = calculate_accuracy(predictions, self.test_data.labels)
        assert accuracy >= 0.92  # Current baseline

    def test_model_handles_edge_cases(self):
        edge_cases = generate_edge_cases()
        predictions = self.model.predict(edge_cases)
        assert all(isinstance(pred, (int, float)) for pred in predictions)
```

## Deployment Environment Setup

### 1. Staging Environment
```terraform
# infrastructure/staging/main.tf
resource "aws_eks_cluster" "staging" {
  name     = "epic22-staging"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.24"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
}

resource "aws_db_instance" "staging" {
  identifier           = "epic22-staging"
  engine              = "postgres"
  engine_version      = "14.6"
  instance_class      = "db.t3.large"
  allocated_storage   = 100
  username           = "epic22_staging"
  password           = var.db_password
  db_subnet_group_name = aws_db_subnet_group.staging.name
  vpc_security_group_ids = [aws_security_group.rds.id]
}
```

### 2. Production Environment
```terraform
# infrastructure/production/main.tf
resource "aws_eks_cluster" "production" {
  name     = "epic22-production"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.24"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
}

# Blue-green deployment setup
resource "aws_lb" "production" {
  name               = "epic22-production"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_listener" "production" {
  load_balancer_arn = aws_lb.production.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.production.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }
}
```

## Environment Validation Checklist

### Development Environment
- [ ] Local Docker containers running
- [ ] Kubernetes cluster operational
- [ ] MLflow tracking server accessible
- [ ] Database connections established
- [ ] Redis cache operational
- [ ] Git hooks configured
- [ ] Pre-commit hooks working
- [ ] IDE extensions installed

### Testing Environment
- [ ] Unit test framework configured
- [ ] Integration tests passing
- [ ] ML model tests operational
- [ ] Performance test suite ready
- [ ] Code coverage reporting working

### Staging Environment
- [ ] Infrastructure provisioned
- [ ] Application deployed
- [ ] Monitoring configured
- [ ] Security policies applied
- [ ] Backup procedures tested

### Production Environment
- [ ] Blue-green deployment ready
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] Disaster recovery tested
- [ ] Security audit completed

## Getting Started Guide

### For New Team Members
1. **Setup Local Environment**
   ```bash
   # Clone and setup
   git clone https://github.com/propertyai/platform.git
   cd platform && npm install
   
   # Start development environment
   docker-compose up -d
   
   # Setup Python environment
   conda env create -f environment.yml
   conda activate epic22-ml
   ```

2. **Configure IDE**
   - Install VS Code extensions for Python, Docker, Kubernetes
   - Configure remote development for cloud resources
   - Set up debugging configurations for ML models

3. **Access Resources**
   - Request AWS credentials and MFA setup
   - Get access to monitoring dashboards
   - Join development Slack channels

4. **First Tasks**
   - Run existing test suite
   - Deploy to staging environment
   - Review Epic 22 planning documents
   - Set up personal development branch

### For ML Engineers
1. **GPU Access Setup**
   ```bash
   # Configure GPU access
   nvidia-smi
   docker run --gpus all nvidia/cuda:11.8-base-ubuntu20.04 nvidia-smi
   ```

2. **ML Pipeline Access**
   - Access Kubeflow dashboard
   - Configure MLflow tracking
   - Set up model registry access

3. **Data Access**
   - Request access to training datasets
   - Configure data pipeline credentials
   - Set up local data caching

## Support and Troubleshooting

### Common Issues
1. **GPU Not Detected**
   ```bash
   # Check GPU status
   nvidia-smi
   # Reinstall NVIDIA drivers if needed
   sudo apt-get install nvidia-driver-520
   ```

2. **Kubernetes Connection Issues**
   ```bash
   # Check cluster status
   kubectl cluster-info
   # Update kubeconfig if needed
   aws eks update-kubeconfig --name epic22-dev
   ```

3. **Database Connection Problems**
   ```bash
   # Test connection
   psql -h localhost -U developer -d propertyai_dev
   # Check Docker container status
   docker-compose ps
   ```

### Support Contacts
- **DevOps**: infrastructure@company.com
- **ML Engineering**: ml-support@company.com
- **Security**: security@company.com
- **Development**: dev-support@company.com

## Environment Maintenance

### Regular Tasks
- **Weekly**: Update dependencies and security patches
- **Monthly**: Review and optimize resource usage
- **Quarterly**: Security audit and compliance review

### Backup and Recovery
- **Database**: Automated daily backups with 30-day retention
- **Code**: Git-based version control with branch protection
- **Infrastructure**: Terraform state backups and disaster recovery tests
- **Models**: MLflow model registry with versioning and rollback

---

**Environment Setup Date**: September 16, 2025
**Environment Status**: 🟢 **READY FOR DEVELOPMENT**
**Next Action**: Sprint 1 Planning Meeting