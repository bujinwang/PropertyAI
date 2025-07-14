resource "google_secret_manager_secret" "default" {
  secret_id = var.secret_id
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "default" {
  secret      = google_secret_manager_secret.default.id
  secret_data = var.secret_value
} 