#!/bin/bash

# SSL Setup script for Audit Stream application with Let's Encrypt
set -e

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

# Validate SSL-specific environment variables
if [[ -z "$DOMAIN_NAME" ]]; then
    error "DOMAIN_NAME environment variable is required for SSL setup"
fi

if [[ -z "$SSL_EMAIL" ]]; then
    error "SSL_EMAIL environment variable is required for Let's Encrypt"
fi

log "Setting up SSL certificates for domain: $DOMAIN_NAME"

# Create necessary directories
mkdir -p ./ssl
mkdir -p ./logs

# Start nginx first to handle the challenge
log "Starting nginx for Let's Encrypt challenge..."
docker-compose -f docker-compose.ssl.yml up -d nginx

# Wait for nginx to be ready
sleep 10

# Get SSL certificate
log "Requesting SSL certificate from Let's Encrypt..."
docker-compose -f docker-compose.ssl.yml run --rm certbot

# Check if certificate was created
if docker-compose -f docker-compose.ssl.yml exec nginx test -f /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem; then
    log "SSL certificate successfully obtained!"
else
    error "Failed to obtain SSL certificate"
fi

# Restart nginx with SSL configuration
log "Restarting nginx with SSL configuration..."
docker-compose -f docker-compose.ssl.yml restart nginx

# Start all services
log "Starting all services with SSL..."
docker-compose -f docker-compose.ssl.yml up -d

# Wait for services to be healthy
log "Waiting for services to be ready..."
timeout=300
counter=0

while ! curl -k -f https://$DOMAIN_NAME/api/health >/dev/null 2>&1; do
    if [[ $counter -ge $timeout ]]; then
        error "Services failed to start within $timeout seconds"
    fi
    sleep 5
    counter=$((counter + 5))
    echo -n "."
done

echo ""
log "Services are healthy and SSL is working!"

# Set up certificate renewal
log "Setting up automatic certificate renewal..."
cat > /tmp/renew-cert.sh << EOF
#!/bin/bash
cd $(pwd)
docker-compose -f docker-compose.ssl.yml run --rm certbot renew
docker-compose -f docker-compose.ssl.yml restart nginx
EOF

chmod +x /tmp/renew-cert.sh
sudo mv /tmp/renew-cert.sh /etc/cron.monthly/renew-audit-stream-cert

log "SSL setup completed successfully!"
log "Application is available at: https://$DOMAIN_NAME"
log "Certificate will be automatically renewed monthly"

# Display service status
echo ""
log "Service Status:"
docker-compose -f docker-compose.ssl.yml ps

# Test SSL
log "Testing SSL configuration..."
if curl -I https://$DOMAIN_NAME >/dev/null 2>&1; then
    log "SSL test passed!"
else
    warn "SSL test failed - please check the configuration"
fi
