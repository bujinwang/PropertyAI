variable "network_name" {
  description = "Name of the VPC network"
  type        = string
  default     = "propertyai-vpc"
}

variable "region" {
  description = "GCP region for the subnets"
  type        = string
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.10.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for the private subnet"
  type        = string
  default     = "10.10.2.0/24"
} 