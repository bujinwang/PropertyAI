variable "bucket_name" {
  description = "Name of the GCS bucket"
  type        = string
}

variable "location" {
  description = "GCP location for the bucket"
  type        = string
  default     = "US"
}

variable "force_destroy" {
  description = "Allow deleting bucket with objects"
  type        = bool
  default     = false
}

variable "versioning" {
  description = "Enable object versioning"
  type        = bool
  default     = true
}

variable "uniform_access" {
  description = "Enable uniform bucket-level access"
  type        = bool
  default     = true
}

variable "public_access" {
  description = "Make bucket publicly readable"
  type        = bool
  default     = false
}

variable "lifecycle_delete_age" {
  description = "Days after which noncurrent versions are deleted"
  type        = number
  default     = 30
} 