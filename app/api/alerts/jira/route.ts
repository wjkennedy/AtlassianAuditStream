import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { jiraUrl, project, issueType, event, severity } = await request.json()

    const jiraIssue = {
      fields: {
        project: {
          key: project,
        },
        summary: `Security Alert: ${event.attributes.action}`,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `A ${severity} severity security event has been detected in the Atlassian audit logs.`,
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Action: ${event.attributes.action}`,
                  marks: [{ type: "strong" }],
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Actor: ${event.attributes.actor.name} (${event.attributes.actor.email})`,
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Time: ${new Date(event.attributes.time).toLocaleString()}`,
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `IP Address: ${event.attributes.location?.ip || "Unknown"}`,
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Event ID: ${event.id}`,
                },
              ],
            },
          ],
        },
        issuetype: {
          name: issueType,
        },
        priority: {
          name: severity === "high" ? "High" : "Medium",
        },
        labels: ["security", "audit", "automated"],
      },
    }

    // In a real implementation, you would use Jira API credentials
    const jiraApiUrl = `${jiraUrl}/rest/api/3/issue`

    // Mock response for demo
    console.log("Would create Jira issue:", jiraIssue)

    return NextResponse.json({
      success: true,
      message: "Jira ticket created",
      issueKey: "SEC-123", // Mock issue key
    })
  } catch (error) {
    console.error("Error creating Jira ticket:", error)
    return NextResponse.json({ error: "Failed to create Jira ticket" }, { status: 500 })
  }
}
