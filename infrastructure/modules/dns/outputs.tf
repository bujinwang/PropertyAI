output "zone_name" {
  value = google_dns_managed_zone.default.name
}

output "name_servers" {
  value = google_dns_managed_zone.default.name_servers
} 