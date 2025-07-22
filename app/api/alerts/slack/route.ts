import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl, event, severity } = await request.json()

    const slackMessage = {
      text: `🚨 Security Alert: ${event.attributes.action}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🚨 ${severity.toUpperCase()} Security Alert`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Action:* ${event.attributes.action}`,
            },
            {
              type: "mrkdwn",
              text: `*Actor:* ${event.attributes.actor.name} (${event.attributes.actor.email})`,
            },
            {
              type: "mrkdwn",
              text: `*Time:* ${new Date(event.attributes.time).toLocaleString()}`,
            },
            {
              type: "mrkdwn",
              text: `*IP:* ${event.attributes.location?.ip || "Unknown"}`,
            },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Event ID: ${event.id} | Source: Atlassian Audit Stream`,
            },
          ],
        },
      ],
    }

    // Send to Slack webhook
    const slackResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    })

    if (!slackResponse.ok) {
      throw new Error(`Slack webhook failed: ${slackResponse.status}`)
    }

    return NextResponse.json({ success: true, message: "Slack alert sent" })
  } catch (error) {
    console.error("Error sending Slack alert:", error)
    return NextResponse.json({ error: "Failed to send Slack alert" }, { status: 500 })
  }
}
