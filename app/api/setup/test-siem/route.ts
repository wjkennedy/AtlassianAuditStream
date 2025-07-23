import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { endpoint, apiKey } = await request.json()

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SIEM endpoint and API key are required",
        },
        { status: 400 },
      )
    }

    // Test SIEM endpoint with a sample event
    const testEvent = {
      timestamp: new Date().toISOString(),
      source: "atlassian-audit-stream",
      event_type: "connection_test",
      severity: "info",
      message: "SIEM connection test from Atlassian Audit Stream",
      metadata: {
        test: true,
        version: "1.0.0",
      },
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey, // Some SIEMs use this header instead
      },
      body: JSON.stringify(testEvent),
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Test event sent to SIEM successfully",
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `SIEM endpoint error: ${response.status} - ${errorText}`,
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
