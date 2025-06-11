output "vpc_network_name" {
  value = module.vpc.network_name
}

output "gke_cluster_name" {
  value = module.gke.cluster_name
}

output "sql_instance_connection_name" {
  value = module.sql.connection_name
}

output "redis_instance_host" {
  value = module.redis.host
}

output "pubsub_topic_name" {
  value = module.pubsub.topic_name
}

output "mongodb_instance_uri" {
  value = module.mongodb.uri
} 