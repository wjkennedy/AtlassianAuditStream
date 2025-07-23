import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, email, apiToken, project } = await request.json()

    if (!url || !email || !apiToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Jira URL, email, and API token are required",
        },
        { status: 400 },
      )
    }

    // Test Jira connection by getting user info
    const testUrl = `${url}/rest/api/3/myself`
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (response.ok) {
      const userData = await response.json()

      // If project is specified, test access to it
      if (project) {
        const projectUrl = `${url}/rest/api/3/project/${project}`
        const projectResponse = await fetch(projectUrl, {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        })

        if (!projectResponse.ok) {
          return NextResponse.json({
            success: false,
            error: `Cannot access project '${project}'. Check project key and permissions.`,
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: "Successfully connected to Jira",
        user: userData.displayName,
        accountId: userData.accountId,
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Jira API error: ${response.status} - ${errorText}`,
      })
    }
  } catch (error) {
    console.error("Jira connection test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    })
  }
}
