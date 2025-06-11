variable "instance_name" {
  description = "Name of the Redis instance"
  type        = string
  default     = "propertyai-redis"
}

variable "region" {
  description = "GCP region for the Redis instance"
  type        = string
}

variable "vpc_network" {
  description = "VPC network self_link for private IP"
  type        = string
}

variable "tier" {
  description = "Service tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "STANDARD_HA"
}

variable "memory_size_gb" {
  description = "Memory size in GB"
  type        = number
  default     = 1
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_7_0"
}

variable "display_name" {
  description = "Display name for the Redis instance"
  type        = string
  default     = "PropertyAI Redis"
} 