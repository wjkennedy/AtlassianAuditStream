import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl, channel } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: "Webhook URL is required" }, { status: 400 })
    }

    // Test Slack webhook with a simple message
    const testMessage = {
      text: "🧪 Test message from Atlassian Audit Stream",
      channel: channel || "#general",
      username: "Audit Stream Bot",
      icon_emoji: ":shield:",
      attachments: [
        {
          color: "good",
          fields: [
            {
              title: "Status",
              value: "Connection test successful",
              short: true,
            },
            {
              title: "Timestamp",
              value: new Date().toISOString(),
              short: true,
            },
          ],
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMessage),
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Test message sent to Slack successfully",
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Slack webhook error: ${response.status} - ${errorText}`,
      })
    }
  } catch (error) {
    console.error("Slack webhook test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Webhook test failed",
    })
  }
}
