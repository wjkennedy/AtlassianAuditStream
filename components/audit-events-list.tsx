import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Shield, User, MapPin, Clock, Activity } from "lucide-react"

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
    location?: {
      ip: string
      countryName?: string
      city?: string
    }
  }
}

interface AuditEventsListProps {
  events: AuditEvent[]
  getCriticalityLevel: (action: string) => "high" | "medium" | "low"
}

export function AuditEventsList({ events, getCriticalityLevel }: AuditEventsListProps) {
  const getCriticalityColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getCriticalityIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <Shield className="h-4 w-4" />
      case "low":
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No audit events available. Start polling to see live events.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4">
        {events.map((event) => {
          const criticality = getCriticalityLevel(event.attributes.action)
          return (
            <Card key={event.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={getCriticalityColor(criticality) as any} className="flex items-center gap-1">
                      {getCriticalityIcon(criticality)}
                      {criticality.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{event.attributes.action}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {new Date(event.attributes.time).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Actor
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {event.attributes.actor.name}
                      </p>
                      <p>
                        <strong>Email:</strong> {event.attributes.actor.email}
                      </p>
                      <p>
                        <strong>ID:</strong> {event.attributes.actor.id}
                      </p>
                    </div>
                  </div>

                  {event.attributes.location && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>IP:</strong> {event.attributes.location.ip}
                        </p>
                        {event.attributes.location.city && (
                          <p>
                            <strong>City:</strong> {event.attributes.location.city}
                          </p>
                        )}
                        {event.attributes.location.countryName && (
                          <p>
                            <strong>Country:</strong> {event.attributes.location.countryName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {event.attributes.context.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Context</h4>
                    <div className="space-y-2">
                      {event.attributes.context.map((ctx, idx) => (
                        <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                          <Badge variant="outline" className="mb-1">
                            {ctx.type}
                          </Badge>
                          <p>
                            <strong>ID:</strong> {ctx.id}
                          </p>
                          {ctx.attributes.name && (
                            <p>
                              <strong>Name:</strong> {ctx.attributes.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )
}
