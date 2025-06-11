variable "secret_id" {
  description = "ID of the secret (name)"
  type        = string
}

variable "secret_value" {
  description = "Value of the secret"
  type        = string
  sensitive   = true
} 