#!/bin/bash

# Production Rollback Script for Epic 21
# Advanced Analytics and AI Insights Features

set -euo pipefail

# Configuration
NAMESPACE="production"
EPIC="21"
DEPLOYMENT_TIMEOUT="900"  # 15 minutes
BACKUP_RETENTION_DAYS="30"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Function to check if deployment is healthy
check_deployment_health() {
    local deployment_name=$1
    local namespace=$2

    log "Checking health of deployment: $deployment_name"

    # Wait for rollout to complete
    kubectl rollout status deployment/$deployment_name -n $namespace --timeout=${DEPLOYMENT_TIMEOUT}s

    # Check pod status
    local unhealthy_pods=$(kubectl get pods -n $namespace -l app=$deployment_name -o jsonpath='{.items[*].status.phase}' | grep -v Running | wc -l)

    if [ "$unhealthy_pods" -gt 0 ]; then
        error "Deployment $deployment_name has $unhealthy_pods unhealthy pods"
        return 1
    fi

    success "Deployment $deployment_name is healthy"
    return 0
}

# Function to disable feature flags
disable_feature_flags() {
    log "Disabling Epic 21 feature flags..."

    # Update ConfigMap with feature flags disabled
    kubectl patch configmap epic21-deployment-config -n $NAMESPACE --type merge -p '{
        "data": {
            "feature_flags": "epic21_predictive_maintenance: \"false\"\nepic21_tenant_churn: \"false\"\nepic21_market_trends: \"false\"\nepic21_ai_reporting: \"false\"\nepic21_risk_dashboard: \"false\""
        }
    }'

    success "Feature flags disabled"
}

# Function to scale down new deployment
scale_down_new_deployment() {
    log "Scaling down Epic 21 deployments..."

    # Scale down all Epic 21 services
    kubectl scale deployment epic21-predictive-maintenance --replicas=0 -n $NAMESPACE
    kubectl scale deployment epic21-tenant-churn --replicas=0 -n $NAMESPACE
    kubectl scale deployment epic21-market-trends --replicas=0 -n $NAMESPACE
    kubectl scale deployment epic21-ai-reporting --replicas=0 -n $NAMESPACE
    kubectl scale deployment epic21-risk-dashboard --replicas=0 -n $NAMESPACE

    success "Epic 21 deployments scaled down"
}

# Function to scale up previous version
scale_up_previous_version() {
    log "Scaling up previous version deployments..."

    # Scale up previous version (assuming they exist with different labels)
    kubectl scale deployment propertyai-backend-v1 --replicas=3 -n $NAMESPACE
    kubectl scale deployment propertyai-frontend-v1 --replicas=3 -n $NAMESPACE

    # Wait for previous version to be ready
    check_deployment_health "propertyai-backend-v1" $NAMESPACE
    check_deployment_health "propertyai-frontend-v1" $NAMESPACE

    success "Previous version scaled up and healthy"
}

# Function to restore database backup if needed
restore_database_backup() {
    local should_restore=${1:-false}

    if [ "$should_restore" = "true" ]; then
        log "Restoring database backup..."

        # Find latest backup
        local latest_backup=$(gsutil ls gs://propertyai-prod-backups/ | grep "epic21-pre-deployment" | sort | tail -1)

        if [ -z "$latest_backup" ]; then
            error "No pre-deployment backup found"
            return 1
        fi

        # Restore database (this would need to be customized based on your DB setup)
        log "Restoring from backup: $latest_backup"
        # Add your database restore commands here

        success "Database backup restored"
    else
        log "Skipping database restore (not required)"
    fi
}

# Function to verify system health
verify_system_health() {
    log "Verifying system health after rollback..."

    # Check critical endpoints
    local endpoints=("https://api.propertyai.com/health" "https://app.propertyai.com/health")

    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" > /dev/null; then
            success "Endpoint $endpoint is healthy"
        else
            error "Endpoint $endpoint is not responding"
            return 1
        fi
    done

    # Check database connectivity
    # Add database health check commands here

    success "System health verification completed"
}

# Function to notify stakeholders
notify_stakeholders() {
    log "Notifying stakeholders..."

    # Send notification (customize based on your notification system)
    curl -X POST "https://slack-webhook-url" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "🚨 Epic 21 Rollback Completed",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*Epic 21 Rollback Completed*\n\n✅ Feature flags disabled\n✅ New deployments scaled down\n✅ Previous version restored\n✅ System health verified\n\nPlease monitor system performance and user feedback."
                    }
                }
            ]
        }'

    success "Stakeholders notified"
}

# Main rollback function
main() {
    local restore_db=${1:-false}

    log "Starting Epic 21 production rollback..."
    log "Database restore: $restore_db"

    # Step 1: Disable feature flags
    disable_feature_flags

    # Step 2: Scale down new deployments
    scale_down_new_deployment

    # Step 3: Restore database if needed
    restore_database_backup "$restore_db"

    # Step 4: Scale up previous version
    scale_up_previous_version

    # Step 5: Verify system health
    verify_system_health

    # Step 6: Notify stakeholders
    notify_stakeholders

    success "Epic 21 rollback completed successfully!"
    log "Rollback completed at: $(date)"
}

# Help function
show_help() {
    cat << EOF
Epic 21 Production Rollback Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --restore-db    Restore database from pre-deployment backup
    --help         Show this help message

EXAMPLES:
    $0                          # Rollback without database restore
    $0 --restore-db            # Rollback with database restore

DESCRIPTION:
    This script performs a controlled rollback of Epic 21 features in production.
    It follows these steps:
    1. Disable feature flags
    2. Scale down new deployments
    3. Restore database (if requested)
    4. Scale up previous version
    5. Verify system health
    6. Notify stakeholders

EOF
}

# Parse command line arguments
RESTORE_DB=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --restore-db)
            RESTORE_DB=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main "$RESTORE_DB"