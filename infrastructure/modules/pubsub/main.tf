resource "google_pubsub_topic" "default" {
  name = var.topic_name
}

resource "google_pubsub_subscription" "default" {
  name  = var.subscription_name
  topic = google_pubsub_topic.default.id
  ack_deadline_seconds = 20
} 