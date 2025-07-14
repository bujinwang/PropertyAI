variable "instance_name" {
  description = "Name of the Cloud SQL instance"
  type        = string
  default     = "propertyai-postgres"
}

variable "region" {
  description = "GCP region for the instance"
  type        = string
}

variable "tier" {
  description = "Machine type for the SQL instance"
  type        = string
  default     = "db-custom-1-3840"
}

variable "vpc_network" {
  description = "VPC network self_link for private IP"
  type        = string
}

variable "db_name" {
  description = "Default database name"
  type        = string
  default     = "propertyai"
}

variable "db_user" {
  description = "Database user name"
  type        = string
  default     = "propertyaiuser"
}

variable "db_password" {
  description = "Database user password"
  type        = string
  sensitive   = true
} 