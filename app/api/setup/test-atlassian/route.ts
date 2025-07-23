import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, baseUrl, orgId } = await request.json()

    if (!apiKey || !orgId) {
      return NextResponse.json({ success: false, error: "API key and Organization ID are required" }, { status: 400 })
    }

    // Test the actual Atlassian API connection
    const testUrl = `${baseUrl}/v1/orgs/${orgId}/events-stream`

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      // Add query params for a minimal test
      // Just get 1 event to test connectivity
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: "Successfully connected to Atlassian API",
        orgName: data.meta?.organization?.name || "Unknown",
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Atlassian API error: ${response.status} - ${errorText}`,
      })
    }
  } catch (error) {
    console.error("Atlassian connection test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    })
  }
}
