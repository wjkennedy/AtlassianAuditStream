#!/bin/bash

# Health check script for monitoring
set -e

APP_URL="${1:-http://localhost:3000}"
SLACK_WEBHOOK="${2:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

send_alert() {
    local message="$1"
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Audit Stream Alert: $message\"}" \
            "$SLACK_WEBHOOK" >/dev/null 2>&1
    fi
}

# Check application health
check_app_health() {
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" || echo "000")
    
    if [[ "$response" == "200" ]]; then
        log "Application health check: OK"
        return 0
    else
        error "Application health check failed (HTTP $response)"
        send_alert "Application health check failed (HTTP $response)"
        return 1
    fi
}

# Check database connectivity
check_database() {
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health/database" || echo "000")
    
    if [[ "$response" == "200" ]]; then
        log "Database health check: OK"
        return 0
    else
        error "Database health check failed (HTTP $response)"
        send_alert "Database connectivity issue (HTTP $response)"
        return 1
    fi
}

# Check Atlassian API connectivity
check_atlassian_api() {
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health/atlassian" || echo "000")
    
    if [[ "$response" == "200" ]]; then
        log "Atlassian API health check: OK"
        return 0
    else
        warn "Atlassian API health check failed (HTTP $response)"
        send_alert "Atlassian API connectivity issue (HTTP $response)"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    local usage
    usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ "$usage" -lt 80 ]]; then
        log "Disk space check: OK ($usage% used)"
        return 0
    elif [[ "$usage" -lt 90 ]]; then
        warn "Disk space warning: $usage% used"
        return 0
    else
        error "Disk space critical: $usage% used"
        send_alert "Disk space critical: $usage% used"
        return 1
    fi
}

# Check memory usage
check_memory() {
    local usage
    usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [[ "$usage" -lt 80 ]]; then
        log "Memory usage check: OK ($usage% used)"
        return 0
    elif [[ "$usage" -lt 90 ]]; then
        warn "Memory usage warning: $usage% used"
        return 0
    else
        error "Memory usage critical: $usage% used"
        send_alert "Memory usage critical: $usage% used"
        return 1
    fi
}

# Main health check
main() {
    log "Starting health checks for Audit Stream..."
    
    local exit_code=0
    
    check_app_health || exit_code=1
    check_database || exit_code=1
    check_atlassian_api || exit_code=1
    check_disk_space || exit_code=1
    check_memory || exit_code=1
    
    if [[ $exit_code -eq 0 ]]; then
        log "All health checks passed!"
    else
        error "Some health checks failed!"
    fi
    
    exit $exit_code
}

main "$@"
