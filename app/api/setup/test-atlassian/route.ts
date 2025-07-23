import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, baseUrl, orgId } = await request.json()

    if (!apiKey || !baseUrl || !orgId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Test the Atlassian API connection
    const testUrl = `${baseUrl}/v1/orgs/${orgId}/events-stream?limit=1`

    const response = await fetch(testUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        orgInfo: {
          orgId,
          hasEvents: data.data && data.data.length > 0,
        },
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `API Error: ${response.status} - ${errorText}`,
      })
    }
  } catch (error) {
    console.error("Atlassian connection test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    })
  }
}
