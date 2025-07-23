import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl, channel } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: "Webhook URL is required" }, { status: 400 })
    }

    // Test Slack webhook
    const testMessage = {
      text: "🧪 Test message from Atlassian Audit Stream",
      channel: channel || "#general",
      username: "Audit Stream Bot",
      icon_emoji: ":shield:",
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
        message: "Test message sent successfully to Slack",
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Slack webhook failed: ${response.status} - ${errorText}`,
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
