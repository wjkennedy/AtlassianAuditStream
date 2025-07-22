import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, Shield, Activity } from "lucide-react"

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
    location?: {
      ip: string
      countryName?: string
      city?: string
    }
  }
}

interface MetricsDashboardProps {
  events: AuditEvent[]
}

export function MetricsDashboard({ events }: MetricsDashboardProps) {
  // Process events for analytics
  const actionCounts = events.reduce(
    (acc, event) => {
      const action = event.attributes.action.split(".")[0] // Get first part of action
      acc[action] = (acc[action] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const actionData = Object.entries(actionCounts).map(([action, count]) => ({
    action,
    count,
  }))

  const locationCounts = events.reduce(
    (acc, event) => {
      const country = event.attributes.location?.countryName || "Unknown"
      acc[country] = (acc[country] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const locationData = Object.entries(locationCounts).map(([country, count]) => ({
    country,
    count,
  }))

  const hourlyActivity = events.reduce(
    (acc, event) => {
      const hour = new Date(event.attributes.time).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    events: hourlyActivity[hour] || 0,
  }))

  const topActors = events.reduce(
    (acc, event) => {
      const actor = event.attributes.actor.name
      acc[actor] = (acc[actor] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topActorsData = Object.entries(topActors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([actor, count]) => ({ actor, count }))

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(actionCounts).length}</div>
            <p className="text-xs text-muted-foreground">Unique action types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(locationCounts).length}</div>
            <p className="text-xs text-muted-foreground">Countries detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(hourlyActivity).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"}:00
            </div>
            <p className="text-xs text-muted-foreground">Most active hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Actor</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topActorsData[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">{topActorsData[0]?.actor || "No data"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Events by Action Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="action" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="events" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Actors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topActorsData.map((actor, index) => (
                <div key={actor.actor} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="text-sm font-medium">{actor.actor}</span>
                  </div>
                  <Badge>{actor.count} events</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance & Security Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800">Compliance Status</h4>
              <p className="text-sm text-green-600 mt-1">All critical events are being monitored and logged</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800">Risk Assessment</h4>
              <p className="text-sm text-yellow-600 mt-1">
                {events.filter((e) => e.attributes.action.includes("admin")).length} admin privilege changes detected
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">Change Management</h4>
              <p className="text-sm text-blue-600 mt-1">
                {events.filter((e) => e.attributes.action.includes("policy")).length} policy modifications tracked
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
