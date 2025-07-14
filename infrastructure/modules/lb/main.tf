resource "google_compute_global_address" "default" {
  name = var.lb_name
}

resource "google_compute_managed_ssl_certificate" "default" {
  name = "${var.lb_name}-ssl"
  managed {
    domains = [var.domain]
  }
}

resource "google_compute_health_check" "default" {
  name               = "${var.lb_name}-hc"
  check_interval_sec = 5
  timeout_sec        = 5
  healthy_threshold  = 2
  unhealthy_threshold = 2

  http_health_check {
    port = 80
    request_path = "/"
  }
}

# NOTE: You must create a NEG (Network Endpoint Group) for your GKE service and pass its self_link here.
# See: https://cloud.google.com/kubernetes-engine/docs/how-to/standalone-neg
resource "google_compute_backend_service" "default" {
  name                  = "${var.lb_name}-backend"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  health_checks         = [google_compute_health_check.default.id]
  enable_cdn            = false

  backend {
    group = var.neg_self_link # Pass the NEG self_link from your GKE service
  }
}

resource "google_compute_url_map" "default" {
  name            = "${var.lb_name}-urlmap"
  default_service = google_compute_backend_service.default.id
}

resource "google_compute_target_https_proxy" "default" {
  name             = "${var.lb_name}-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_global_forwarding_rule" "default" {
  name                  = "${var.lb_name}-fwd-rule"
  ip_address            = google_compute_global_address.default.id
  port_range            = "443"
  target                = google_compute_target_https_proxy.default.id
} 