// Utility functions for processing audit events and triggering alerts

export interface AuditEvent {
  id: string
  type: string
  attributes: {
    time: string
    action: string
    actor: {
      id: string
      name: string
      email: string
    }
    context: Array<{
      id: string
      type: string
      attributes: any
    }>
    location?: {
      ip: string
      countryName?: string
      city?: string
    }
  }
}

export interface AlertRule {
  id: number
  rule_name: string
  action_pattern: string
  severity: "high" | "medium" | "low"
  enabled: boolean
}

export interface AlertChannel {
  id: number
  channel_type: "slack" | "jira" | "siem"
  channel_name: string
  configuration: any
  enabled: boolean
}

export class AuditProcessor {
  private alertRules: AlertRule[] = []
  private alertChannels: AlertChannel[] = []

  constructor(rules: AlertRule[], channels: AlertChannel[]) {
    this.alertRules = rules.filter((rule) => rule.enabled)
    this.alertChannels = channels.filter((channel) => channel.enabled)
  }

  /**
   * Process a batch of audit events and trigger alerts for matching rules
   */
  async processEvents(events: AuditEvent[]): Promise<void> {
    for (const event of events) {
      await this.processEvent(event)
    }
  }

  /**
   * Process a single audit event
   */
  async processEvent(event: AuditEvent): Promise<void> {
    const matchingRules = this.getMatchingRules(event)

    for (const rule of matchingRules) {
      await this.triggerAlerts(event, rule)
    }
  }

  /**
   * Find alert rules that match the given event
   */
  private getMatchingRules(event: AuditEvent): AlertRule[] {
    return this.alertRules.filter((rule) => event.attributes.action.includes(rule.action_pattern))
  }

  /**
   * Trigger alerts for all configured channels
   */
  private async triggerAlerts(event: AuditEvent, rule: AlertRule): Promise<void> {
    const alertPromises = this.alertChannels.map((channel) => this.sendAlert(event, rule, channel))

    await Promise.allSettled(alertPromises)
  }

  /**
   * Send alert to a specific channel
   */
  private async sendAlert(event: AuditEvent, rule: AlertRule, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.channel_type) {
        case "slack":
          await this.sendSlackAlert(event, rule, channel)
          break
        case "jira":
          await this.sendJiraAlert(event, rule, channel)
          break
        case "siem":
          await this.sendSiemAlert(event, rule, channel)
          break
      }
    } catch (error) {
      console.error(`Failed to send ${channel.channel_type} alert:`, error)
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(event: AuditEvent, rule: AlertRule, channel: AlertChannel): Promise<void> {
    const response = await fetch("/api/alerts/slack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhookUrl: channel.configuration.webhook_url,
        event,
        severity: rule.severity,
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack alert failed: ${response.status}`)
    }
  }

  /**
   * Send Jira alert
   */
  private async sendJiraAlert(event: AuditEvent, rule: AlertRule, channel: AlertChannel): Promise<void> {
    const response = await fetch("/api/alerts/jira", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jiraUrl: channel.configuration.url,
        project: channel.configuration.project,
        issueType: channel.configuration.issue_type || "Task",
        event,
        severity: rule.severity,
      }),
    })

    if (!response.ok) {
      throw new Error(`Jira alert failed: ${response.status}`)
    }
  }

  /**
   * Send SIEM alert
   */
  private async sendSiemAlert(event: AuditEvent, rule: AlertRule, channel: AlertChannel): Promise<void> {
    const response = await fetch("/api/alerts/siem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: channel.configuration.endpoint,
        apiKey: channel.configuration.api_key,
        event,
        severity: rule.severity,
      }),
    })

    if (!response.ok) {
      throw new Error(`SIEM alert failed: ${response.status}`)
    }
  }

  /**
   * Get severity level for an action
   */
  static getSeverityLevel(action: string): "high" | "medium" | "low" {
    if (action.includes("admin.privilege") || action.includes("policy") || action.includes("suspended")) {
      return "high"
    }
    if (action.includes("failed") || action.includes("login") || action.includes("domain")) {
      return "medium"
    }
    return "low"
  }

  /**
   * Filter events based on criteria
   */
  static filterEvents(
    events: AuditEvent[],
    filters: {
      action?: string
      actor?: string[]
      product?: string[]
      from?: string
      to?: string
      ip?: string[]
    },
  ): AuditEvent[] {
    return events.filter((event) => {
      // Action filter
      if (filters.action && !event.attributes.action.includes(filters.action)) {
        return false
      }

      // Actor filter
      if (filters.actor && filters.actor.length > 0) {
        const actorMatch = filters.actor.some(
          (actor) => event.attributes.actor.email.includes(actor) || event.attributes.actor.name.includes(actor),
        )
        if (!actorMatch) return false
      }

      // Time range filter
      if (filters.from || filters.to) {
        const eventTime = new Date(event.attributes.time).getTime()
        if (filters.from && eventTime < new Date(filters.from).getTime()) {
          return false
        }
        if (filters.to && eventTime > new Date(filters.to).getTime()) {
          return false
        }
      }

      // IP filter
      if (filters.ip && filters.ip.length > 0 && event.attributes.location) {
        const ipMatch = filters.ip.some((ip) => event.attributes.location?.ip.includes(ip))
        if (!ipMatch) return false
      }

      return true
    })
  }
}

/**
 * Utility function to poll Atlassian audit events
 */
export async function pollAuditEvents(
  orgId: string,
  cursor?: string,
  filters?: any,
): Promise<{ events: AuditEvent[]; nextCursor?: string }> {
  const params = new URLSearchParams({
    orgId,
    ...(cursor && { cursor }),
    ...(filters?.from && { from: new Date(filters.from).getTime().toString() }),
    ...(filters?.to && { to: new Date(filters.to).getTime().toString() }),
    ...(filters?.limit && { limit: filters.limit.toString() }),
    ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
  })

  const response = await fetch(`/api/audit-stream?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch audit events: ${response.status}`)
  }

  const data = await response.json()

  return {
    events: data.data || [],
    nextCursor: data.meta?.next,
  }
}
