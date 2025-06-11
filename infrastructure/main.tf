terraform {
  required_version = ">= 1.7.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "vpc" {
  source             = "./modules/vpc"
  network_name       = "propertyai-vpc"
  region             = var.region
  public_subnet_cidr = "10.10.1.0/24"
  private_subnet_cidr = "10.10.2.0/24"
}

module "gke" {
  source        = "./modules/gke"
  cluster_name  = "propertyai-gke"
  region        = var.region
  network       = module.vpc.network_self_link
  subnetwork    = module.vpc.private_subnet_self_link
  node_count    = 3
  machine_type  = "e2-medium"
  min_count     = 1
  max_count     = 5
  environment   = var.environment
}

module "sql" {
  source        = "./modules/sql"
  instance_name = "propertyai-postgres"
  region        = var.region
  tier          = "db-custom-1-3840"
  vpc_network   = module.vpc.network_self_link
  db_name       = "propertyai"
  db_user       = "propertyaiuser"
  db_password   = "changeme123" # Replace with a secure secret in production
}

module "redis" {
  source         = "./modules/redis"
  instance_name  = "propertyai-redis"
  region         = var.region
  vpc_network    = module.vpc.network_self_link
  tier           = "STANDARD_HA"
  memory_size_gb = 1
  redis_version  = "REDIS_7_0"
  display_name   = "PropertyAI Redis"
}

module "pubsub" {
  source            = "./modules/pubsub"
  topic_name        = "propertyai-events"
  subscription_name = "propertyai-events-sub"
}

module "mongodb" {
  source = "./modules/mongodb"
  # Add required variables here
} 