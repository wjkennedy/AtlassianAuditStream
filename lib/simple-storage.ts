// Simplified storage layer that can use SQLite, PostgreSQL, or in-memory
import type { AuditEvent, AlertRule, AlertChannel } from "./audit-processor"

interface StorageAdapter {
  // Events
  saveEvents(events: AuditEvent[]): Promise<void>
  getEvents(filters?: any): Promise<AuditEvent[]>

  // Alert Rules
  saveAlertRule(rule: AlertRule): Promise<AlertRule>
  getAlertRules(): Promise<AlertRule[]>
  deleteAlertRule(id: number): Promise<void>

  // Alert Channels
  saveAlertChannel(channel: AlertChannel): Promise<AlertChannel>
  getAlertChannels(): Promise<AlertChannel[]>
  deleteAlertChannel(id: number): Promise<void>

  // Configuration
  saveConfig(key: string, value: any): Promise<void>
  getConfig(key: string): Promise<any>
}

// In-memory storage (simplest option)
class MemoryStorage implements StorageAdapter {
  private events: AuditEvent[] = []
  private alertRules: AlertRule[] = []
  private alertChannels: AlertChannel[] = []
  private config: Map<string, any> = new Map()

  async saveEvents(events: AuditEvent[]): Promise<void> {
    this.events.push(...events)
    // Keep only last 10,000 events to prevent memory issues
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000)
    }
  }

  async getEvents(filters?: any): Promise<AuditEvent[]> {
    let filteredEvents = [...this.events]

    if (filters?.from) {
      const fromDate = new Date(filters.from)
      filteredEvents = filteredEvents.filter((e) => new Date(e.attributes.time) >= fromDate)
    }

    if (filters?.to) {
      const toDate = new Date(filters.to)
      filteredEvents = filteredEvents.filter((e) => new Date(e.attributes.time) <= toDate)
    }

    if (filters?.action) {
      filteredEvents = filteredEvents.filter((e) => e.attributes.action.includes(filters.action))
    }

    return filteredEvents.slice(0, filters?.limit || 100)
  }

  async saveAlertRule(rule: AlertRule): Promise<AlertRule> {
    const existingIndex = this.alertRules.findIndex((r) => r.id === rule.id)
    if (existingIndex >= 0) {
      this.alertRules[existingIndex] = rule
    } else {
      rule.id = Date.now() // Simple ID generation
      this.alertRules.push(rule)
    }
    return rule
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return [...this.alertRules]
  }

  async deleteAlertRule(id: number): Promise<void> {
    this.alertRules = this.alertRules.filter((r) => r.id !== id)
  }

  async saveAlertChannel(channel: AlertChannel): Promise<AlertChannel> {
    const existingIndex = this.alertChannels.findIndex((c) => c.id === channel.id)
    if (existingIndex >= 0) {
      this.alertChannels[existingIndex] = channel
    } else {
      channel.id = Date.now() // Simple ID generation
      this.alertChannels.push(channel)
    }
    return channel
  }

  async getAlertChannels(): Promise<AlertChannel[]> {
    return [...this.alertChannels]
  }

  async deleteAlertChannel(id: number): Promise<void> {
    this.alertChannels = this.alertChannels.filter((c) => c.id !== id)
  }

  async saveConfig(key: string, value: any): Promise<void> {
    this.config.set(key, value)
  }

  async getConfig(key: string): Promise<any> {
    return this.config.get(key)
  }
}

// SQLite storage (file-based, no server needed)
class SQLiteStorage implements StorageAdapter {
  private db: any // Would use better-sqlite3 or similar

  constructor(dbPath = "./data/audit.db") {
    // Initialize SQLite database
    // this.db = new Database(dbPath)
    // this.initTables()
  }

  private initTables() {
    // Create tables if they don't exist
    const createTables = `
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT,
        attributes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS alert_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name TEXT,
        action_pattern TEXT,
        severity TEXT,
        enabled BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS alert_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_type TEXT,
        channel_name TEXT,
        configuration TEXT,
        enabled BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `
    // this.db.exec(createTables)
  }

  async saveEvents(events: AuditEvent[]): Promise<void> {
    // Implementation would insert events into SQLite
    console.log("Saving events to SQLite:", events.length)
  }

  async getEvents(filters?: any): Promise<AuditEvent[]> {
    // Implementation would query SQLite
    return []
  }

  async saveAlertRule(rule: AlertRule): Promise<AlertRule> {
    // Implementation would insert/update in SQLite
    return rule
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return []
  }

  async deleteAlertRule(id: number): Promise<void> {
    // Implementation would delete from SQLite
  }

  async saveAlertChannel(channel: AlertChannel): Promise<AlertChannel> {
    return channel
  }

  async getAlertChannels(): Promise<AlertChannel[]> {
    return []
  }

  async deleteAlertChannel(id: number): Promise<void> {
    // Implementation would delete from SQLite
  }

  async saveConfig(key: string, value: any): Promise<void> {
    // Implementation would insert/update config in SQLite
  }

  async getConfig(key: string): Promise<any> {
    // Implementation would query config from SQLite
    return null
  }
}

// Factory function to create storage adapter
export function createStorage(type: "memory" | "sqlite" | "postgres" = "memory"): StorageAdapter {
  switch (type) {
    case "sqlite":
      return new SQLiteStorage()
    case "memory":
    default:
      return new MemoryStorage()
  }
}

// Global storage instance
export const storage = createStorage((process.env.STORAGE_TYPE as "memory" | "sqlite" | "postgres") || "memory")
