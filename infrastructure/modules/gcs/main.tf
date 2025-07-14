resource "google_storage_bucket" "default" {
  name     = var.bucket_name
  location = var.location
  force_destroy = var.force_destroy

  versioning {
    enabled = var.versioning
  }

  uniform_bucket_level_access = var.uniform_access

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = var.lifecycle_delete_age
      is_live = false
    }
  }
}

resource "google_storage_bucket_iam_binding" "public" {
  count  = var.public_access ? 1 : 0
  bucket = google_storage_bucket.default.name
  role   = "roles/storage.objectViewer"
  members = ["allUsers"]
} 