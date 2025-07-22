import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { endpoint, apiKey, event, severity } = await request.json()

    const siemPayload = {
      timestamp: new Date().toISOString(),
      source: "atlassian-audit-stream",
      severity: severity,
      event_type: "security_alert",
      event_id: event.id,
      action: event.attributes.action,
      actor: {
        id: event.attributes.actor.id,
        name: event.attributes.actor.name,
        email: event.attributes.actor.email,
      },
      location: event.attributes.location,
      context: event.attributes.context,
      raw_event: event,
    }

    // Send to SIEM endpoint
    const siemResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Source": "atlassian-audit-stream",
      },
      body: JSON.stringify(siemPayload),
    })

    if (!siemResponse.ok) {
      throw new Error(`SIEM API failed: ${siemResponse.status}`)
    }

    return NextResponse.json({ success: true, message: "SIEM alert sent" })
  } catch (error) {
    console.error("Error sending SIEM alert:", error)
    return NextResponse.json({ error: "Failed to send SIEM alert" }, { status: 500 })
  }
}
