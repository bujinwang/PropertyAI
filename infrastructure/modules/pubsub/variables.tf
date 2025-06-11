variable "topic_name" {
  description = "Name of the Pub/Sub topic"
  type        = string
  default     = "propertyai-events"
}

variable "subscription_name" {
  description = "Name of the Pub/Sub subscription"
  type        = string
  default     = "propertyai-events-sub"
} 