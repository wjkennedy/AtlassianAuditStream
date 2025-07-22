#!/bin/bash

# Deployment script for Audit Stream application
set -e

# Configuration
APP_NAME="audit-stream"
DOCKER_IMAGE="$APP_NAME:latest"
BACKUP_DIR="/var/backups/$APP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Check required commands
command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required but not installed"

# Check environment file
if [[ ! -f .env.local ]]; then
    error ".env.local file not found. Please create it with required environment variables."
fi

# Source environment variables
set -a
source .env.local
set +a

# Validate required environment variables
required_vars=("ATLASSIAN_API_KEY" "ATLASSIAN_ORG_ID" "DATABASE_URL")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        error "Required environment variable $var is not set"
    fi
done

log "Starting deployment of $APP_NAME..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database if it exists
if docker-compose ps postgres | grep -q "Up"; then
    log "Creating database backup..."
    docker-compose exec -T postgres pg_dump -U postgres audit_stream | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    log "Database backup created"
fi

# Pull latest changes (if using git)
if [[ -d .git ]]; then
    log "Pulling latest changes..."
    git pull origin main
fi

# Build new image
log "Building Docker image..."
docker build -t "$DOCKER_IMAGE" .

# Stop existing containers
log "Stopping existing containers..."
docker-compose down

# Start new containers
log "Starting new containers..."
docker-compose up -d

# Wait for services to be healthy
log "Waiting for services to be ready..."
timeout=300
counter=0

while ! docker-compose exec -T app curl -f http://localhost:3000/api/health >/dev/null 2>&1; do
    if [[ $counter -ge $timeout ]]; then
        error "Services failed to start within $timeout seconds"
    fi
    sleep 5
    counter=$((counter + 5))
    echo -n "."
done

echo ""
log "Services are healthy!"

# Clean up old images
log "Cleaning up old Docker images..."
docker image prune -f

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

log "Deployment completed successfully!"
log "Application is available at: http://localhost:3000"

# Display service status
echo ""
log "Service Status:"
docker-compose ps
