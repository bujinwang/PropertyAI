variable "lb_name" {
  description = "Name for the load balancer and related resources"
  type        = string
  default     = "propertyai-lb"
}

variable "domain" {
  description = "Domain name for the managed SSL certificate"
  type        = string
}

variable "neg_self_link" {
  description = "Self-link of the Network Endpoint Group (NEG) for the GKE service"
  type        = string
} 