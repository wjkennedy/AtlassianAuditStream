"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Shield, Users, Activity, Settings, Bell } from "lucide-react"
import { AuditEventsList } from "@/components/audit-events-list"
import { AlertsConfig } from "@/components/alerts-config"
import { FilterPanel } from "@/components/filter-panel"
import { MetricsDashboard } from "@/components/metrics-dashboard"

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
    context: Array<{
      id: string
      type: string
      attributes: any
    }>
    container?: Array<{
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

interface FilterState {
  action: string
  product: string[]
  actor: string[]
  from: string
  to: string
  ip: string[]
}

export default function AuditStreamDashboard() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    action: "",
    product: [],
    actor: [],
    from: "",
    to: "",
    ip: [],
  })
  const [alertsEnabled, setAlertsEnabled] = useState(false)
  const [criticalEvents, setCriticalEvents] = useState<AuditEvent[]>([])

  // Mock data for demonstration
  const mockEvents: AuditEvent[] = [
    {
      id: "1",
      type: "events",
      attributes: {
        time: new Date().toISOString(),
        action: "user.admin.privilege.granted",
        actor: {
          id: "user123",
          name: "John Admin",
          email: "john.admin@company.com",
        },
        context: [
          {
            id: "user456",
            type: "user",
            attributes: { name: "Jane Doe", email: "jane.doe@company.com" },
          },
        ],
        location: {
          ip: "192.168.1.100",
          countryName: "United States",
          city: "San Francisco",
        },
      },
    },
    {
      id: "2",
      type: "events",
      attributes: {
        time: new Date(Date.now() - 300000).toISOString(),
        action: "policy.ip-allowlist.updated",
        actor: {
          id: "user789",
          name: "Security Admin",
          email: "security@company.com",
        },
        context: [
          {
            id: "policy123",
            type: "policy",
            attributes: { name: "Corporate IP Allowlist" },
          },
        ],
        location: {
          ip: "10.0.0.50",
          countryName: "United States",
          city: "New York",
        },
      },
    },
    {
      id: "3",
      type: "events",
      attributes: {
        time: new Date(Date.now() - 600000).toISOString(),
        action: "user.login.failed",
        actor: {
          id: "user999",
          name: "Unknown User",
          email: "suspicious@external.com",
        },
        context: [
          {
            id: "login-attempt",
            type: "authentication",
            attributes: { attempts: 5 },
          },
        ],
        location: {
          ip: "203.0.113.42",
          countryName: "Unknown",
          city: "Unknown",
        },
      },
    },
  ]

  const startPolling = () => {
    setIsPolling(true)
    // Simulate polling with mock data
    setEvents(mockEvents)

    // Check for critical events
    const critical = mockEvents.filter(
      (event) =>
        event.attributes.action.includes("admin.privilege") ||
        event.attributes.action.includes("policy") ||
        event.attributes.action.includes("failed"),
    )
    setCriticalEvents(critical)
  }

  const stopPolling = () => {
    setIsPolling(false)
  }

  const getCriticalityLevel = (action: string) => {
    if (action.includes("admin.privilege") || action.includes("policy")) return "high"
    if (action.includes("failed") || action.includes("suspended")) return "medium"
    return "low"
  }

  const filteredEvents = events.filter((event) => {
    if (filters.action && !event.attributes.action.includes(filters.action)) return false
    if (
      filters.actor.length > 0 &&
      !filters.actor.some(
        (actor) => event.attributes.actor.email.includes(actor) || event.attributes.actor.name.includes(actor),
      )
    )
      return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Centralized Audit Stream</h1>
            <p className="text-gray-600 mt-2">Real-time compliance monitoring and security incident investigation</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={isPolling ? "default" : "secondary"} className="px-3 py-1">
              {isPolling ? "Polling Active" : "Polling Stopped"}
            </Badge>
            {isPolling ? (
              <Button onClick={stopPolling} variant="outline">
                Stop Polling
              </Button>
            ) : (
              <Button onClick={startPolling}>Start Polling</Button>
            )}
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalEvents.length}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(events.map((e) => e.attributes.actor.id)).size}</div>
              <p className="text-xs text-muted-foreground">Unique actors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts Sent</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertsEnabled ? criticalEvents.length : 0}</div>
              <p className="text-xs text-muted-foreground">To configured channels</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">Audit Events</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="alerts">Alerts Config</TabsTrigger>
            <TabsTrigger value="metrics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Live Audit Events Stream
                </CardTitle>
                <CardDescription>Real-time audit log events from your Atlassian organization</CardDescription>
              </CardHeader>
              <CardContent>
                <AuditEventsList events={filteredEvents} getCriticalityLevel={getCriticalityLevel} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Event Filters
                </CardTitle>
                <CardDescription>Configure filters for Action, Product, Actor, and more</CardDescription>
              </CardHeader>
              <CardContent>
                <FilterPanel filters={filters} onFiltersChange={setFilters} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Actionable Alerting
                </CardTitle>
                <CardDescription>Configure alerts for Slack, SIEM, and Jira ticket creation</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsConfig
                  alertsEnabled={alertsEnabled}
                  onAlertsToggle={setAlertsEnabled}
                  criticalEvents={criticalEvents}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <MetricsDashboard events={events} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
