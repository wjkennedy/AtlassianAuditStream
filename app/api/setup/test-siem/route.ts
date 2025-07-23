import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { endpoint, apiKey } = await request.json()

    if (!endpoint || !apiKey) {
      return NextResponse.json({ success: false, error: "SIEM endpoint and API key are required" }, { status: 400 })
    }

    // Test SIEM endpoint with a sample event
    const testEvent = {
      timestamp: new Date().toISOString(),
      source: "atlassian-audit-stream",
      event_type: "test",
      message: "Test connection from Atlassian Audit Stream",
      severity: "info",
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testEvent),
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "SIEM connection successful",
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `SIEM API Error: ${response.status} - ${errorText}`,
      })
    }
  } catch (error) {
    console.error("SIEM connection test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    })
  }
}
