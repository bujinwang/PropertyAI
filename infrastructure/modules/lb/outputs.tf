output "ip_address" {
  value = google_compute_global_address.default.address
}

output "forwarding_rule_name" {
  value = google_compute_global_forwarding_rule.default.name
} 