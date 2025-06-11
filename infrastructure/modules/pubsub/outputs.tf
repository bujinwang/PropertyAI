output "topic_name" {
  value = google_pubsub_topic.default.name
}

output "subscription_name" {
  value = google_pubsub_subscription.default.name
} 