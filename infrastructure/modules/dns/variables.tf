variable "zone_name" {
  description = "Name of the DNS managed zone"
  type        = string
}

variable "domain" {
  description = "Domain name (must end with a dot, e.g., 'example.com.')"
  type        = string
}

variable "ip_address" {
  description = "IP address for the A record"
  type        = string
} 