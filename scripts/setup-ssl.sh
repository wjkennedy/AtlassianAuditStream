#!/bin/bash

# SSL Setup Script for Atlassian Audit Stream
# This script sets up Let's Encrypt SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found. Please copy .env.example to .env.local and configure it."
    exit 1
fi

# Source environment variables
source .env.local

# Validate required environment variables
if [ -z "$DOMAIN_NAME" ]; then
    print_error "DOMAIN_NAME is not set in .env.local"
    exit 1
fi

if [ -z "$SSL_EMAIL" ]; then
    print_error "SSL_EMAIL is not set in .env.local"
    exit 1
fi

print_status "Setting up SSL for domain: $DOMAIN_NAME"
print_status "SSL email: $SSL_EMAIL"

# Create necessary directories
mkdir -p certbot/conf
mkdir -p certbot/www

# Check if certificates already exist
if [ -d "certbot/conf/live/$DOMAIN_NAME" ]; then
    print_warning "SSL certificates already exist for $DOMAIN_NAME"
    read -p "Do you want to renew them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Skipping certificate generation"
        SKIP_CERT=true
    fi
fi

# Start nginx temporarily for certificate validation
print_status "Starting temporary nginx for certificate validation..."
docker-compose -f docker-compose.ssl.yml up -d nginx

# Wait for nginx to be ready
sleep 5

# Generate SSL certificates if needed
if [ "$SKIP_CERT" != "true" ]; then
    print_status "Requesting SSL certificate from Let's Encrypt..."
    
    docker-compose -f docker-compose.ssl.yml run --rm certbot \
        certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email $SSL_EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN_NAME
    
    if [ $? -eq 0 ]; then
        print_status "SSL certificate obtained successfully!"
    else
        print_error "Failed to obtain SSL certificate"
        docker-compose -f docker-compose.ssl.yml down
        exit 1
    fi
fi

# Stop temporary containers
docker-compose -f docker-compose.ssl.yml down

# Start the full application with SSL
print_status "Starting application with SSL..."
docker-compose -f docker-compose.ssl.yml up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Test SSL configuration
print_status "Testing SSL configuration..."
if curl -f -s -I https://$DOMAIN_NAME > /dev/null; then
    print_status "SSL is working correctly!"
    print_status "Your application is now available at: https://$DOMAIN_NAME"
else
    print_warning "SSL test failed. Please check the logs:"
    print_warning "docker-compose -f docker-compose.ssl.yml logs nginx"
fi

# Set up automatic certificate renewal
print_status "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * cd $(pwd) && docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --quiet && docker-compose -f docker-compose.ssl.yml exec nginx nginx -s reload") | crontab -

print_status "Setup complete!"
print_status "Your Atlassian Audit Stream is now running with SSL at: https://$DOMAIN_NAME"
print_status ""
print_status "Useful commands:"
print_status "  View logs: docker-compose -f docker-compose.ssl.yml logs -f"
print_status "  Stop services: docker-compose -f docker-compose.ssl.yml down"
print_status "  Restart services: docker-compose -f docker-compose.ssl.yml restart"
print_status "  Renew certificates: docker-compose -f docker-compose.ssl.yml exec certbot certbot renew"
