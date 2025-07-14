resource "google_redis_instance" "default" {
  name           = var.instance_name
  tier           = var.tier
  memory_size_gb = var.memory_size_gb
  region         = var.region
  authorized_network = var.vpc_network
  redis_version  = var.redis_version
  display_name   = var.display_name
} 