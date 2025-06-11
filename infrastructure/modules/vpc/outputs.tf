output "network_name" {
  value = google_compute_network.main.name
}

output "network_self_link" {
  value = google_compute_network.main.self_link
}

output "public_subnet_name" {
  value = google_compute_subnetwork.public.name
}

output "public_subnet_self_link" {
  value = google_compute_subnetwork.public.self_link
}

output "private_subnet_name" {
  value = google_compute_subnetwork.private.name
}

output "private_subnet_self_link" {
  value = google_compute_subnetwork.private.self_link
} 