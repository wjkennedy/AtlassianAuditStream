"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Key,
  Globe,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  TestTube,
  Save,
  Activity,
} from "lucide-react"

interface SetupConfig {
  atlassian: {
    apiKey: string
    baseUrl: string
    orgId: string
    testConnection: boolean
  }
  database: {
    url: string
    testConnection: boolean
  }
  alerts: {
    slack: {
      enabled: boolean
      webhookUrl: string
      channel: string
    }
    jira: {
      enabled: boolean
      url: string
      email: string
      apiToken: string
      project: string
    }
    siem: {
      enabled: boolean
      endpoint: string
      apiKey: string
      format: string
    }
  }
  polling: {
    interval: number
    batchSize: number
    enabled: boolean
  }
}

interface SetupPanelProps {
  onConfigSave: (config: SetupConfig) => void
  initialConfig?: Partial<SetupConfig>
}

export function SetupPanel({ onConfigSave, initialConfig }: SetupPanelProps) {
  const [config, setConfig] = useState<SetupConfig>({
    atlassian: {
      apiKey: "",
      baseUrl: "https://api.atlassian.com/admin",
      orgId: "",
      testConnection: false,
    },
    database: {
      url: "",
      testConnection: false,
    },
    alerts: {
      slack: {
        enabled: false,
        webhookUrl: "",
        channel: "#security-alerts",
      },
      jira: {
        enabled: false,
        url: "",
        email: "",
        apiToken: "",
        project: "",
      },
      siem: {
        enabled: false,
        endpoint: "",
        apiKey: "",
        format: "json",
      },
    },
    polling: {
      interval: 30,
      batchSize: 200,
      enabled: false,
    },
  })

  const [showPasswords, setShowPasswords] = useState({
    atlassianApiKey: false,
    databaseUrl: false,
    jiraApiToken: false,
    siemApiKey: false,
  })

  const [testResults, setTestResults] = useState({
    atlassian: null as boolean | null,
    database: null as boolean | null,
    slack: null as boolean | null,
    jira: null as boolean | null,
    siem: null as boolean | null,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  // Load initial config
  useEffect(() => {
    if (initialConfig) {
      setConfig((prev) => ({ ...prev, ...initialConfig }))
    }

    // Load from localStorage if available
    const savedConfig = localStorage.getItem("atlassian-audit-config")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig((prev) => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error("Failed to load saved config:", error)
      }
    }
  }, [initialConfig])

  const updateConfig = (section: keyof SetupConfig, field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const updateNestedConfig = (section: keyof SetupConfig, subsection: string, field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value,
        },
      },
    }))
  }

  const testAtlassianConnection = async () => {
    try {
      const response = await fetch("/api/setup/test-atlassian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: config.atlassian.apiKey,
          baseUrl: config.atlassian.baseUrl,
          orgId: config.atlassian.orgId,
        }),
      })

      const result = await response.json()
      setTestResults((prev) => ({ ...prev, atlassian: result.success }))
      updateConfig("atlassian", "testConnection", result.success)
    } catch (error) {
      setTestResults((prev) => ({ ...prev, atlassian: false }))
      updateConfig("atlassian", "testConnection", false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch("/api/setup/test-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: config.database.url }),
      })

      const result = await response.json()
      setTestResults((prev) => ({ ...prev, database: result.success }))
      updateConfig("database", "testConnection", result.success)
    } catch (error) {
      setTestResults((prev) => ({ ...prev, database: false }))
      updateConfig("database", "testConnection", false)
    }
  }

  const testSlackWebhook = async () => {
    try {
      const response = await fetch("/api/setup/test-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: config.alerts.slack.webhookUrl,
          channel: config.alerts.slack.channel,
        }),
      })

      const result = await response.json()
      setTestResults((prev) => ({ ...prev, slack: result.success }))
    } catch (error) {
      setTestResults((prev) => ({ ...prev, slack: false }))
    }
  }

  const testJiraConnection = async () => {
    try {
      const response = await fetch("/api/setup/test-jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: config.alerts.jira.url,
          email: config.alerts.jira.email,
          apiToken: config.alerts.jira.apiToken,
          project: config.alerts.jira.project,
        }),
      })

      const result = await response.json()
      setTestResults((prev) => ({ ...prev, jira: result.success }))
    } catch (error) {
      setTestResults((prev) => ({ ...prev, jira: false }))
    }
  }

  const testSiemConnection = async () => {
    try {
      const response = await fetch("/api/setup/test-siem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: config.alerts.siem.endpoint,
          apiKey: config.alerts.siem.apiKey,
        }),
      })

      const result = await response.json()
      setTestResults((prev) => ({ ...prev, siem: result.success }))
    } catch (error) {
      setTestResults((prev) => ({ ...prev, siem: false }))
    }
  }

  const saveConfiguration = async () => {
    setIsSaving(true)
    setSaveStatus("idle")

    try {
      // Save to localStorage
      localStorage.setItem("atlassian-audit-config", JSON.stringify(config))

      // Save to backend
      const response = await fetch("/api/setup/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setSaveStatus("success")
        onConfigSave(config)
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      setSaveStatus("error")
      console.error("Failed to save configuration:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getConnectionStatus = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Not Tested</Badge>
    if (status === true)
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      )
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    )
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Setup & Configuration
          </h2>
          <p className="text-gray-600 mt-1">Configure your Atlassian Audit Stream settings</p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "success" && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
          {saveStatus === "error" && (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              Save Failed
            </Badge>
          )}
          <Button onClick={saveConfiguration} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="atlassian" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="atlassian">Atlassian API</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="alerts">Alert Channels</TabsTrigger>
          <TabsTrigger value="polling">Polling Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="atlassian" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Atlassian API Configuration
              </CardTitle>
              <CardDescription>Configure your Atlassian API credentials and organization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key *</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showPasswords.atlassianApiKey ? "text" : "password"}
                      placeholder="Your Atlassian API key"
                      value={config.atlassian.apiKey}
                      onChange={(e) => updateConfig("atlassian", "apiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility("atlassianApiKey")}
                    >
                      {showPasswords.atlassianApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-id">Organization ID *</Label>
                  <Input
                    id="org-id"
                    placeholder="your-org-id"
                    value={config.atlassian.orgId}
                    onChange={(e) => updateConfig("atlassian", "orgId", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-url">Base URL</Label>
                <Input
                  id="base-url"
                  placeholder="https://api.atlassian.com/admin"
                  value={config.atlassian.baseUrl}
                  onChange={(e) => updateConfig("atlassian", "baseUrl", e.target.value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connection Status</h4>
                  <p className="text-sm text-gray-600">Test your Atlassian API connection</p>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionStatus(testResults.atlassian)}
                  <Button
                    onClick={testAtlassianConnection}
                    disabled={!config.atlassian.apiKey || !config.atlassian.orgId}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You can generate an API key from your Atlassian Admin console under API tokens. Make sure the key has
                  permissions to read audit logs.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>Configure your PostgreSQL database connection for storing audit events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="db-url">Database URL *</Label>
                <div className="relative">
                  <Textarea
                    id="db-url"
                    placeholder="postgresql://username:password@host:port/database"
                    value={config.database.url}
                    onChange={(e) => updateConfig("database", "url", e.target.value)}
                    rows={3}
                    className={showPasswords.databaseUrl ? "" : "font-mono"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => togglePasswordVisibility("databaseUrl")}
                  >
                    {showPasswords.databaseUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connection Status</h4>
                  <p className="text-sm text-gray-600">Test your database connection</p>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionStatus(testResults.database)}
                  <Button onClick={testDatabaseConnection} disabled={!config.database.url} variant="outline" size="sm">
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  We recommend using a managed PostgreSQL service like Neon, Supabase, or AWS RDS for production
                  deployments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Slack Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                  Slack Integration
                </div>
                <Switch
                  checked={config.alerts.slack.enabled}
                  onCheckedChange={(enabled) => updateNestedConfig("alerts", "slack", "enabled", enabled)}
                />
              </CardTitle>
              <CardDescription>Send real-time alerts to Slack channels</CardDescription>
            </CardHeader>
            {config.alerts.slack.enabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slack-webhook">Webhook URL *</Label>
                    <Input
                      id="slack-webhook"
                      placeholder="https://hooks.slack.com/services/..."
                      value={config.alerts.slack.webhookUrl}
                      onChange={(e) => updateNestedConfig("alerts", "slack", "webhookUrl", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slack-channel">Channel</Label>
                    <Input
                      id="slack-channel"
                      placeholder="#security-alerts"
                      value={config.alerts.slack.channel}
                      onChange={(e) => updateNestedConfig("alerts", "slack", "channel", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionStatus(testResults.slack)}
                  <Button
                    onClick={testSlackWebhook}
                    disabled={!config.alerts.slack.webhookUrl}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Webhook
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Jira Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    J
                  </div>
                  Jira Integration
                </div>
                <Switch
                  checked={config.alerts.jira.enabled}
                  onCheckedChange={(enabled) => updateNestedConfig("alerts", "jira", "enabled", enabled)}
                />
              </CardTitle>
              <CardDescription>Automatically create Jira tickets for critical events</CardDescription>
            </CardHeader>
            {config.alerts.jira.enabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jira-url">Jira URL *</Label>
                    <Input
                      id="jira-url"
                      placeholder="https://company.atlassian.net"
                      value={config.alerts.jira.url}
                      onChange={(e) => updateNestedConfig("alerts", "jira", "url", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jira-email">Email *</Label>
                    <Input
                      id="jira-email"
                      type="email"
                      placeholder="user@company.com"
                      value={config.alerts.jira.email}
                      onChange={(e) => updateNestedConfig("alerts", "jira", "email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jira-token">API Token *</Label>
                    <div className="relative">
                      <Input
                        id="jira-token"
                        type={showPasswords.jiraApiToken ? "text" : "password"}
                        placeholder="Your Jira API token"
                        value={config.alerts.jira.apiToken}
                        onChange={(e) => updateNestedConfig("alerts", "jira", "apiToken", e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility("jiraApiToken")}
                      >
                        {showPasswords.jiraApiToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jira-project">Project Key *</Label>
                    <Input
                      id="jira-project"
                      placeholder="SEC"
                      value={config.alerts.jira.project}
                      onChange={(e) => updateNestedConfig("alerts", "jira", "project", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionStatus(testResults.jira)}
                  <Button
                    onClick={testJiraConnection}
                    disabled={!config.alerts.jira.url || !config.alerts.jira.email || !config.alerts.jira.apiToken}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* SIEM Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  SIEM Integration
                </div>
                <Switch
                  checked={config.alerts.siem.enabled}
                  onCheckedChange={(enabled) => updateNestedConfig("alerts", "siem", "enabled", enabled)}
                />
              </CardTitle>
              <CardDescription>Forward events to your SIEM system</CardDescription>
            </CardHeader>
            {config.alerts.siem.enabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siem-endpoint">SIEM Endpoint *</Label>
                    <Input
                      id="siem-endpoint"
                      placeholder="https://siem.company.com/api/events"
                      value={config.alerts.siem.endpoint}
                      onChange={(e) => updateNestedConfig("alerts", "siem", "endpoint", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siem-format">Format</Label>
                    <Input
                      id="siem-format"
                      placeholder="json"
                      value={config.alerts.siem.format}
                      onChange={(e) => updateNestedConfig("alerts", "siem", "format", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siem-key">API Key *</Label>
                  <div className="relative">
                    <Input
                      id="siem-key"
                      type={showPasswords.siemApiKey ? "text" : "password"}
                      placeholder="Your SIEM API key"
                      value={config.alerts.siem.apiKey}
                      onChange={(e) => updateNestedConfig("alerts", "siem", "apiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility("siemApiKey")}
                    >
                      {showPasswords.siemApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionStatus(testResults.siem)}
                  <Button
                    onClick={testSiemConnection}
                    disabled={!config.alerts.siem.endpoint || !config.alerts.siem.apiKey}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="polling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Polling Configuration
                </div>
                <Switch
                  checked={config.polling.enabled}
                  onCheckedChange={(enabled) => updateConfig("polling", "enabled", enabled)}
                />
              </CardTitle>
              <CardDescription>Configure how frequently to poll for new audit events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poll-interval">Polling Interval (seconds)</Label>
                  <Input
                    id="poll-interval"
                    type="number"
                    min="10"
                    max="3600"
                    value={config.polling.interval}
                    onChange={(e) => updateConfig("polling", "interval", Number.parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-600">Minimum: 10 seconds, Maximum: 1 hour</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="50"
                    max="1000"
                    value={config.polling.batchSize}
                    onChange={(e) => updateConfig("polling", "batchSize", Number.parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-600">Number of events to fetch per request</p>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Lower polling intervals provide more real-time monitoring but may increase API usage. Consider your
                  Atlassian API rate limits when setting the interval.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
