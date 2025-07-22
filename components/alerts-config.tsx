"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slack, AlertTriangle, Ticket, Database } from "lucide-react"
import { useState } from "react"

interface AuditEvent {
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
  }
}

interface AlertsConfigProps {
  alertsEnabled: boolean
  onAlertsToggle: (enabled: boolean) => void
  criticalEvents: AuditEvent[]
}

export function AlertsConfig({ alertsEnabled, onAlertsToggle, criticalEvents }: AlertsConfigProps) {
  const [slackWebhook, setSlackWebhook] = useState("")
  const [jiraConfig, setJiraConfig] = useState({
    url: "",
    project: "",
    issueType: "Task",
  })
  const [siemConfig, setSiemConfig] = useState({
    endpoint: "",
    apiKey: "",
  })
  const [alertRules, setAlertRules] = useState([
    { action: "admin.privilege.granted", severity: "high", enabled: true },
    { action: "policy.updated", severity: "medium", enabled: true },
    { action: "login.failed", severity: "medium", enabled: false },
  ])

  const testSlackAlert = () => {
    if (!slackWebhook) return

    // Simulate sending alert
    console.log("Sending Slack alert:", {
      webhook: slackWebhook,
      message: `🚨 Critical Event Detected: ${criticalEvents[0]?.attributes.action}`,
    })

    alert("Slack alert sent successfully! (This is a demo)")
  }

  const testJiraTicket = () => {
    if (!jiraConfig.url || !jiraConfig.project) return

    console.log("Creating Jira ticket:", {
      ...jiraConfig,
      summary: `Security Alert: ${criticalEvents[0]?.attributes.action}`,
      description: `Critical audit event detected at ${new Date().toISOString()}`,
    })

    alert("Jira ticket created successfully! (This is a demo)")
  }

  const testSiemAlert = () => {
    if (!siemConfig.endpoint) return

    console.log("Sending SIEM alert:", {
      ...siemConfig,
      event: criticalEvents[0],
    })

    alert("SIEM alert sent successfully! (This is a demo)")
  }

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <h3 className="font-semibold">Enable Actionable Alerting</h3>
          <p className="text-sm text-gray-600">Automatically send alerts for critical events to configured channels</p>
        </div>
        <Switch checked={alertsEnabled} onCheckedChange={onAlertsToggle} />
      </div>

      {alertsEnabled && (
        <>
          {/* Alert Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => {
                          const newRules = [...alertRules]
                          newRules[index].enabled = enabled
                          setAlertRules(newRules)
                        }}
                      />
                      <div>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{rule.action}</code>
                        <Badge variant={rule.severity === "high" ? "destructive" : "default"} className="ml-2">
                          {rule.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Slack Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Slack className="h-5 w-5" />
                Slack Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={testSlackAlert} disabled={!slackWebhook}>
                  Test Slack Alert
                </Button>
                <Badge variant="outline">{criticalEvents.length} events would trigger alerts</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Jira Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Jira Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jira-url">Jira URL</Label>
                  <Input
                    id="jira-url"
                    placeholder="https://company.atlassian.net"
                    value={jiraConfig.url}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="jira-project">Project Key</Label>
                  <Input
                    id="jira-project"
                    placeholder="SEC"
                    value={jiraConfig.project}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, project: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="jira-issue-type">Issue Type</Label>
                <Select
                  value={jiraConfig.issueType}
                  onValueChange={(value) => setJiraConfig({ ...jiraConfig, issueType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Bug">Bug</SelectItem>
                    <SelectItem value="Incident">Incident</SelectItem>
                    <SelectItem value="Security Issue">Security Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={testJiraTicket} disabled={!jiraConfig.url || !jiraConfig.project}>
                Test Jira Ticket Creation
              </Button>
            </CardContent>
          </Card>

          {/* SIEM Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                SIEM Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siem-endpoint">SIEM Endpoint</Label>
                <Input
                  id="siem-endpoint"
                  placeholder="https://siem.company.com/api/events"
                  value={siemConfig.endpoint}
                  onChange={(e) => setSiemConfig({ ...siemConfig, endpoint: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="siem-key">API Key</Label>
                <Input
                  id="siem-key"
                  type="password"
                  placeholder="Your SIEM API key"
                  value={siemConfig.apiKey}
                  onChange={(e) => setSiemConfig({ ...siemConfig, apiKey: e.target.value })}
                />
              </div>
              <Button onClick={testSiemAlert} disabled={!siemConfig.endpoint}>
                Test SIEM Alert
              </Button>
            </CardContent>
          </Card>

          {/* Sample Alert Payload */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Alert Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={JSON.stringify(
                  {
                    timestamp: new Date().toISOString(),
                    severity: "high",
                    event: criticalEvents[0] || "No critical events",
                    source: "Atlassian Audit Stream",
                    organization: "your-org-id",
                  },
                  null,
                  2,
                )}
                className="font-mono text-sm"
                rows={10}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
