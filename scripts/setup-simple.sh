#!/bin/bash

echo "🚀 Setting up Simplified Atlassian Audit Stream"

# Create data directory for SQLite
mkdir -p data

# Set default environment variables
cat > .env.local << EOF
# Atlassian Configuration
ATLASSIAN_API_KEY=your_api_key_here
ATLASSIAN_ORG_ID=your_org_id_here
ATLASSIAN_BASE_URL=https://api.atlassian.com/admin

# Storage Configuration (memory, sqlite, or postgres)
STORAGE_TYPE=memory

# Database URL (only needed if using postgres)
# DATABASE_URL=postgresql://user:password@localhost:5432/audit_stream

# Optional: Slack webhook for alerts
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Optional: Jira integration
# JIRA_URL=https://company.atlassian.net
# JIRA_EMAIL=user@company.com
# JIRA_API_TOKEN=your_jira_token

# Optional: SIEM integration
# SIEM_ENDPOINT=https://siem.company.com/api/events
# SIEM_API_KEY=your_siem_key

# Application Settings
NODE_ENV=development
PORT=3000
EOF

echo "✅ Created .env.local with default configuration"
echo "📝 Please edit .env.local with your actual credentials"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev    # Development mode"
echo "  npm start      # Production mode"
echo ""
echo "To use Docker:"
echo "  docker-compose -f docker-compose.simple.yml up"
