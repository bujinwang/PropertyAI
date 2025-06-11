provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

resource "mongodbatlas_project" "project" {
  name   = var.project_name
  org_id = var.org_id
}

resource "mongodbatlas_cluster" "cluster" {
  project_id   = mongodbatlas_project.project.id
  name         = var.cluster_name
  provider_name = "GCP"
  region_name   = var.region
  cluster_type  = "REPLICASET"
  replication_factor = 3
  num_shards         = 1
  provider_instance_size_name = var.instance_size
  provider_backup_enabled     = true
} 