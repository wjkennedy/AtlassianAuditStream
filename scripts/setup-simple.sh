#!/bin/bash

# Simple setup script for the Atlassian Audit Stream without external dependencies

echo "🚀 Setting up Atlassian Audit Stream (Simple Mode)"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p logs
mkdir -p ssl

# Set permissions
chmod 755 data
chmod 755 logs

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating environment file..."
    cat > .env.local << EOF
# Atlassian Configuration
ATLASSIAN_API_KEY=your_atlassian_api_key_here
ATLASSIAN_DOMAIN=your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email@company.com

# Storage Configuration
FILE_STORAGE_PATH=./data

# Alert Configuration
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
JIRA_PROJECT_KEY=SEC
SIEM_ENDPOINT=https://your-siem-endpoint.com/api/events

# Application Configuration
NODE_ENV=production
PORT=3000
EOF
    echo "✅ Environment file created at .env.local"
    echo "⚠️  Please edit .env.local with your actual configuration values"
else
    echo "✅ Environment file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create systemd service file (optional)
if command -v systemctl &> /dev/null; then
    echo "🔧 Creating systemd service..."
    sudo tee /etc/systemd/system/atlassian-audit-stream.service > /dev/null << EOF
[Unit]
Description=Atlassian Audit Stream
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which npm) start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    echo "✅ Systemd service created"
    echo "To enable and start the service:"
    echo "  sudo systemctl enable atlassian-audit-stream"
    echo "  sudo systemctl start atlassian-audit-stream"
fi

# Create nginx configuration (optional)
if command -v nginx &> /dev/null; then
    echo "🌐 Creating nginx configuration..."
    sudo tee /etc/nginx/sites-available/atlassian-audit-stream > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    echo "✅ Nginx configuration created"
    echo "To enable the site:"
    echo "  sudo ln -s /etc/nginx/sites-available/atlassian-audit-stream /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
fi

# Create health check script
echo "🏥 Creating health check script..."
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for Atlassian Audit Stream

URL="http://localhost:3000/api/health"
TIMEOUT=10

echo "Checking application health..."

if curl -f -s --max-time $TIMEOUT "$URL" > /dev/null; then
    echo "✅ Application is healthy"
    exit 0
else
    echo "❌ Application is not responding"
    exit 1
fi
EOF

chmod +x scripts/health-check.sh

# Create backup script
echo "💾 Creating backup script..."
cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for Atlassian Audit Stream data

BACKUP_DIR="./backups"
DATA_DIR="./data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/audit_data_$TIMESTAMP.tar.gz"

echo "Creating backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create compressed backup
tar -czf "$BACKUP_FILE" -C "$DATA_DIR" .

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/audit_data_*.tar.gz | tail -n +11 | xargs -r rm
    echo "🧹 Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi
EOF

chmod +x scripts/backup.sh

# Create restore script
echo "🔄 Creating restore script..."
cat > scripts/restore.sh << 'EOF'
#!/bin/bash

# Restore script for Atlassian Audit Stream data

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la ./backups/audit_data_*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DATA_DIR="./data"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  This will overwrite existing data. Continue? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Restoring from backup..."
    
    # Backup current data
    if [ -d "$DATA_DIR" ]; then
        mv "$DATA_DIR" "${DATA_DIR}.backup.$(date +%s)"
    fi
    
    # Create data directory
    mkdir -p "$DATA_DIR"
    
    # Extract backup
    tar -xzf "$BACKUP_FILE" -C "$DATA_DIR"
    
    if [ $? -eq 0 ]; then
        echo "✅ Restore completed successfully"
    else
        echo "❌ Restore failed"
        exit 1
    fi
else
    echo "Restore cancelled"
fi
EOF

chmod +x scripts/restore.sh

# Simple storage and cache environment setup
echo "Setting up simple storage and cache environment..."

# Create a directory for simple file storage if it doesn't exist
# This is where simple_storage.json will be stored
mkdir -p data

echo "Simple storage directory 'data/' created/ensured."
echo "Setup complete. You can now run your application using docker-compose.simple.yml"
echo "Remember to set the FILE_STORAGE_PATH environment variable if running outside Docker."

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Start the application: npm start"
echo "3. Visit http://localhost:3000 to access the setup panel"
echo ""
echo "Optional:"
echo "- Enable systemd service for auto-start"
echo "- Configure nginx for reverse proxy"
echo "- Set up SSL certificates"
echo ""
echo "Useful commands:"
echo "- Health check: ./scripts/health-check.sh"
echo "- Create backup: ./scripts/backup.sh"
echo "- Restore backup: ./scripts/restore.sh <backup_file>"
