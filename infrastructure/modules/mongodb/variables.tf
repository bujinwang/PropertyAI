variable "atlas_public_key" {
  description = "MongoDB Atlas API public key"
  type        = string
}

variable "atlas_private_key" {
  description = "MongoDB Atlas API private key"
  type        = string
  sensitive   = true
}

variable "org_id" {
  description = "MongoDB Atlas organization ID"
  type        = string
}

variable "project_name" {
  description = "MongoDB Atlas project name"
  type        = string
  default     = "PropertyAI"
}

variable "cluster_name" {
  description = "MongoDB Atlas cluster name"
  type        = string
  default     = "propertyai-mongodb"
}

variable "region" {
  description = "GCP region for the cluster"
  type        = string
  default     = "CENTRAL_US"
}

variable "instance_size" {
  description = "Instance size for the cluster"
  type        = string
  default     = "M10"
} 