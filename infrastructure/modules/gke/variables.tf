variable "cluster_name" {
  description = "Name of the GKE cluster"
  type        = string
  default     = "propertyai-gke"
}

variable "region" {
  description = "GCP region for the cluster"
  type        = string
}

variable "network" {
  description = "VPC network self_link or name"
  type        = string
}

variable "subnetwork" {
  description = "Subnetwork self_link or name"
  type        = string
}

variable "node_count" {
  description = "Number of nodes in the default node pool"
  type        = number
  default     = 3
}

variable "machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "e2-medium"
}

variable "min_count" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 1
}

variable "max_count" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 5
}

variable "environment" {
  description = "Deployment environment label"
  type        = string
  default     = "dev"
} 