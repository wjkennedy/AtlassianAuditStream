# Centralized Audit Stream for Atlassian Access

A comprehensive audit log monitoring and alerting system for Atlassian organizations. This application polls audit events from the Atlassian Access API and provides real-time monitoring, filtering, and actionable alerting to Slack, Jira, and SIEM systems.

## Features

- 🔄 **Real-time Audit Log Polling** - Continuous monitoring of Atlassian audit events
- 🎯 **Advanced Filtering** - Filter by action, product, actor, time range, and IP address
- 🚨 **Multi-channel Alerting** - Send alerts to Slack, Jira, and SIEM systems
- 📊 **Analytics Dashboard** - Visual insights and compliance reporting
- 🛡️ **Security Monitoring** - Track privilege changes, failed logins, and policy updates
- 📋 **Compliance Tracking** - Monitor change management and access controls

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL or MySQL database
- Atlassian Access API key and Organization ID
- (Optional) Slack webhook URL for alerts
- (Optional) Jira instance for ticket creation
- (Optional) SIEM endpoint for security integration

## Quick Start

### 1. Clone and Install


    git clone <repository-url>
    cd atlassian-audit-stream
    npm install


### 2. Environment Configuration

Create a `.env.local` file:

\`\`\`env
# Atlassian API Configuration
ATLASSIAN_API_KEY=your_api_key_here
ATLASSIAN_ORG_ID=your_org_id_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/audit_stream
# OR for MySQL:
# DATABASE_URL=mysql://username:password@localhost:3306/audit_stream

# Optional: Alert Integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
JIRA_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token

# Optional: SIEM Integration
SIEM_ENDPOINT=https://your-siem.company.com/api/events
SIEM_API_KEY=your_siem_api_key

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 3. Database Setup

Run the database initialization script:

\`\`\`bash
# For PostgreSQL
psql -d audit_stream -f scripts/create-audit-tables.sql

# For MySQL
mysql -u username -p audit_stream < scripts/create-audit-tables.sql
\`\`\`

### 4. Development Server

\`\`\`
npm run dev
\`\`\`

Visit `http://localhost:3000` to access the dashboard.

## Deployment Options

### Option 1: Vercel Deployment (Recommended)

#### Prerequisites
- Vercel account
- PostgreSQL database (Neon, Supabase, or AWS RDS)

#### Steps

1. **Deploy to Vercel**
\`\`\`
npm install -g vercel
vercel
\`\`\`

2. **Configure Environment Variables in Vercel**
\`\`\`
vercel env add ATLASSIAN_API_KEY
vercel env add ATLASSIAN_ORG_ID
vercel env add DATABASE_URL
# Add other environment variables as needed
\`\`\`

3. **Set up Database**
\`\`\`
# If using Neon (recommended)
npm install @neondatabase/serverless
# Run the SQL script in your Neon console or via CLI
\`\`\`

4. **Deploy**
\`\`\`
vercel --prod
\`\`\`

### Option 2: Docker Deployment

#### Prerequisites
- Docker and Docker Compose
- PostgreSQL database

#### Steps

1. **Create docker-compose.yml**
\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ATLASSIAN_API_KEY=${ATLASSIAN_API_KEY}
      - ATLASSIAN_ORG_ID=${ATLASSIAN_ORG_ID}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=audit_stream
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/create-audit-tables.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

volumes:
  postgres_data:
\`\`\`

2. **Create Dockerfile**
\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
\`\`\`

3. **Deploy**
\`\`\`bash
docker-compose up -d
\`\`\`

### Option 3: AWS Deployment

#### Prerequisites
- AWS Account
- AWS CLI configured
- RDS PostgreSQL instance

#### Steps

1. **Create RDS Database**
\`\`\`bash
aws rds create-db-instance \
  --db-instance-identifier audit-stream-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123 \
  --allocated-storage 20
\`\`\`

2. **Deploy with AWS App Runner**
\`\`\`bash
# Create apprunner.yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - npm ci
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 3000
    env: PORT
  env:
    - name: ATLASSIAN_API_KEY
      value: ${ATLASSIAN_API_KEY}
    - name: DATABASE_URL
      value: ${DATABASE_URL}
\`\`\`

3. **Create App Runner Service**
\`\`\`bash
aws apprunner create-service \
  --service-name audit-stream \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "your-ecr-repo-uri",
      "ImageConfiguration": {
        "Port": "3000"
      }
    }
  }'
\`\`\`

### Option 4: Self-Hosted Server

#### Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+, PostgreSQL, Nginx

#### Steps

1. **Server Setup**
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
\`\`\`

2. **Database Setup**
\`\`\`bash
sudo -u postgres createdb audit_stream
sudo -u postgres psql -d audit_stream -f scripts/create-audit-tables.sql
\`\`\`

3. **Application Setup**
\`\`\``bash
# Clone repository
git clone <repository-url> /var/www/audit-stream
cd /var/www/audit-stream

# Install dependencies
npm ci --production

# Build application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'audit-stream',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/audit-stream',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

4. **Nginx Configuration**
\`\`\``bash
sudo tee /etc/nginx/sites-available/audit-stream << EOF
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

sudo ln -s /etc/nginx/sites-available/audit-stream /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

5. **SSL Certificate (Optional)**
\`\`\`bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

## Configuration

### Atlassian API Setup

1. **Get API Key and Organization ID**
   - Go to [Atlassian Administration](https://admin.atlassian.com)
   - Navigate to Settings > API keys
   - Create a new API key
   - Copy your Organization ID from the URL

2. **Required Permissions**
   - Organization admin role
   - Access to audit logs (Enterprise plan required)

### Alert Channel Configuration

#### Slack Integration
1. Create a Slack app in your workspace
2. Enable Incoming Webhooks
3. Copy the webhook URL to `SLACK_WEBHOOK_URL`

#### Jira Integration
1. Create an API token in Jira
2. Set `JIRA_URL`, `JIRA_EMAIL`, and `JIRA_API_TOKEN`
3. Ensure the user has permission to create issues

#### SIEM Integration
1. Configure your SIEM to accept webhook events
2. Set `SIEM_ENDPOINT` and `SIEM_API_KEY`

## Monitoring and Maintenance

### Health Checks

The application provides health check endpoints:

- `GET /api/health` - Application health
- `GET /api/health/database` - Database connectivity
- `GET /api/health/atlassian` - Atlassian API connectivity

### Logging

Logs are written to:
- Console (development)
- Files in `/logs` directory (production)
- External logging service (if configured)

### Backup

Regular database backups are recommended:

\`\`\`bash
# PostgreSQL backup
pg_dump audit_stream > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/audit-stream"
mkdir -p $BACKUP_DIR
pg_dump audit_stream | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x backup.sh
# Add to crontab: 0 2 * * * /path/to/backup.sh
\`\`\`

### Performance Optimization

1. **Database Indexing**
   - Ensure indexes on frequently queried columns
   - Monitor query performance

2. **Caching**
   - Enable Redis for session storage
   - Cache frequently accessed data

3. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Monitor Atlassian API rate limits

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   \`\`\`bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT 1;"
  \`\`\`

2. **Atlassian API Rate Limits**
   - Monitor rate limit headers
   - Implement exponential backoff
   - Use polling endpoint for high-volume scenarios

3. **Alert Delivery Failures**
   - Check webhook URLs and credentials
   - Verify network connectivity
   - Review application logs

### Debug Mode

Enable debug logging:
\`\`\`env
DEBUG=audit-stream:*
LOG_LEVEL=debug
\`\`\`

## Security Considerations

1. **API Key Security**
   - Store API keys securely
   - Rotate keys regularly
   - Use environment variables, never commit to code

2. **Database Security**
   - Use SSL connections
   - Implement proper access controls
   - Regular security updates

3. **Network Security**
   - Use HTTPS in production
   - Implement proper firewall rules
   - Consider VPN for internal access

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Consult Atlassian API documentation
4. Create an issue in the repository

## License

[Your License Here]
