import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, email, apiToken, project } = await request.json()

    if (!url || !email || !apiToken || !project) {
      return NextResponse.json({ success: false, error: "All Jira fields are required" }, { status: 400 })
    }

    // Test Jira API connection by getting project info
    const testUrl = `${url}/rest/api/3/project/${project}`
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

    const response = await fetch(testUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (response.ok) {
      const projectData = await response.json()
      return NextResponse.json({
        success: true,
        message: "Jira connection successful",
        projectInfo: {
          key: projectData.key,
          name: projectData.name,
          projectTypeKey: projectData.projectTypeKey,
        },
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Jira API Error: ${response.status} - ${errorText}`,
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
