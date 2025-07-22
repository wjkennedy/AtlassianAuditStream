-- Create tables for storing audit events and alert configurations
-- This script demonstrates how you might store audit data for analysis

CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    actor_name VARCHAR(255),
    actor_email VARCHAR(255),
    event_time TIMESTAMP NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    country VARCHAR(100),
    city VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'low',
    raw_event JSONB NOT NULL,
    INDEX idx_event_time (event_time),
    INDEX idx_action (action),
    INDEX idx_actor_id (actor_id),
    INDEX idx_severity (severity)
);

CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    action_pattern VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_channels (
    id SERIAL PRIMARY KEY,
    channel_type VARCHAR(50) NOT NULL, -- 'slack', 'jira', 'siem'
    channel_name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    rule_id INTEGER REFERENCES alert_rules(id),
    channel_id INTEGER REFERENCES alert_channels(id),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    response_data JSONB,
    FOREIGN KEY (event_id) REFERENCES audit_events(id)
);

-- Insert sample alert rules
INSERT INTO alert_rules (rule_name, action_pattern, severity) VALUES
('Admin Privilege Changes', 'admin.privilege', 'high'),
('Policy Updates', 'policy.', 'medium'),
('Failed Login Attempts', 'login.failed', 'medium'),
('User Suspensions', 'user.suspended', 'high'),
('Domain Changes', 'domain.', 'high');

-- Insert sample alert channels
INSERT INTO alert_channels (channel_type, channel_name, configuration) VALUES
('slack', 'Security Alerts', '{"webhook_url": "https://hooks.slack.com/services/..."}'),
('jira', 'Security Project', '{"url": "https://company.atlassian.net", "project": "SEC", "issue_type": "Task"}'),
('siem', 'Main SIEM', '{"endpoint": "https://siem.company.com/api/events", "api_key": "encrypted_key"}');
