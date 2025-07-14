terraform {
  backend "gcs" {
    bucket  = "propertyai-terraform-state"
    prefix  = "terraform/state"
  }
} 