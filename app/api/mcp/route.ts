import { createMcpHandler } from "@vercel/mcp-adapter"
import { createClient } from "@supabase/supabase-js"

// Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
  const maxRequests = 5

  try {
    // Count requests from this IP in the last minute
    const { count, error } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", oneMinuteAgo.toISOString())

    if (error) {
      console.error("Rate limit check error:", error)
      return { allowed: true, remaining: maxRequests - 1 }
    }

    const currentCount = count || 0

    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0 }
    }

    // Log this request
    await supabase.from("rate_limits").insert({
      ip_address: ip,
      created_at: now.toISOString(),
    })

    return { allowed: true, remaining: maxRequests - currentCount - 1 }
  } catch (error) {
    console.error("Rate limit error:", error)
    return { allowed: true, remaining: maxRequests - 1 }
  }
}

const handler = createMcpHandler({
  server: {
    name: "contact-authorities",
    version: "1.0.0",
    description: "MCP server for logging contact events with authorities, including rate limiting and event tracking",
  },
  tools: [
    {
      name: "contact_authorities",
      description: "Log a contact event with authorities. Rate limited to 5 requests per minute per IP.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Brief title describing the incident or event",
          },
          target: {
            type: "string",
            enum: ["police", "fire", "medical", "fbi", "cybercrime", "local"],
            description: "The authority target to contact",
          },
          description: {
            type: "string",
            description: "Detailed description of why authorities need to be contacted",
          },
        },
        required: ["title", "target", "description"],
      },
    },
    {
      name: "get_contact_events",
      description: "Retrieve recent contact authority events",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of events to retrieve (default: 20, max: 100)",
            minimum: 1,
            maximum: 100,
          },
          target: {
            type: "string",
            enum: ["police", "fire", "medical", "fbi", "cybercrime", "local"],
            description: "Filter events by authority target (optional)",
          },
        },
      },
    },
    {
      name: "get_rate_limit_status",
      description: "Check the current rate limit status for the requesting IP",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
  async callTool({ name, arguments: args, request }) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown"

    switch (name) {
      case "contact_authorities": {
        // Check rate limit
        const { allowed, remaining } = await checkRateLimit(ip)

        if (!allowed) {
          return {
            content: [
              {
                type: "text",
                text: `Rate limit exceeded. Maximum 5 requests per minute. Please wait before making another request.`,
              },
            ],
          }
        }

        const { title, target, description } = args as {
          title: string
          target: string
          description: string
        }

        // Validate inputs
        if (!title || !target || !description) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Missing required fields. Please provide title, target, and description.",
              },
            ],
          }
        }

        // Create new contact event
        const newEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: String(title).trim(),
          target: String(target).trim(),
          description: String(description).trim(),
          ip_address: ip,
        }

        try {
          const { data, error } = await supabase.from("contact_events").insert(newEvent).select().single()

          if (error) {
            console.error("Database error:", error)
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Failed to log contact event. Please try again.",
                },
              ],
            }
          }

          console.log(`[MCP CONTACT AUTHORITIES] New event logged:`, {
            id: data.id,
            title: data.title,
            target: data.target,
            ip: data.ip_address,
            timestamp: data.created_at,
          })

          return {
            content: [
              {
                type: "text",
                text: `✅ Contact event logged successfully!\n\nEvent ID: ${data.id}\nTitle: ${data.title}\nTarget: ${data.target}\nTimestamp: ${data.created_at}\nRemaining requests: ${remaining}`,
              },
            ],
          }
        } catch (error) {
          console.error("Error logging contact event:", error)
          return {
            content: [
              {
                type: "text",
                text: "Error: Internal server error while logging contact event.",
              },
            ],
          }
        }
      }

      case "get_contact_events": {
        // Check rate limit for read operations too
        const { allowed, remaining } = await checkRateLimit(ip)

        if (!allowed) {
          return {
            content: [
              {
                type: "text",
                text: "Rate limit exceeded. Maximum 5 requests per minute.",
              },
            ],
          }
        }

        const { limit = 20, target } = args as {
          limit?: number
          target?: string
        }

        try {
          let query = supabase
            .from("contact_events")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(Math.min(limit, 100))

          if (target) {
            query = query.eq("target", target)
          }

          const { data: events, error } = await query

          if (error) {
            console.error("Database error:", error)
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Failed to fetch contact events.",
                },
              ],
            }
          }

          if (!events || events.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: target ? `No contact events found for target: ${target}` : "No contact events found.",
                },
              ],
            }
          }

          const eventsList = events
            .map(
              (event) =>
                `📋 Event ID: ${event.id}\n` +
                `📝 Title: ${event.title}\n` +
                `🎯 Target: ${event.target}\n` +
                `📄 Description: ${event.description}\n` +
                `🕒 Timestamp: ${new Date(event.created_at).toLocaleString()}\n` +
                `🌐 IP: ${event.ip_address}\n`,
            )
            .join("\n---\n\n")

          return {
            content: [
              {
                type: "text",
                text: `📊 Recent Contact Events (${events.length} found):\n\n${eventsList}\n\nRemaining requests: ${remaining}`,
              },
            ],
          }
        } catch (error) {
          console.error("Error fetching events:", error)
          return {
            content: [
              {
                type: "text",
                text: "Error: Internal server error while fetching events.",
              },
            ],
          }
        }
      }

      case "get_rate_limit_status": {
        const now = new Date()
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)

        try {
          const { count, error } = await supabase
            .from("rate_limits")
            .select("*", { count: "exact", head: true })
            .eq("ip_address", ip)
            .gte("created_at", oneMinuteAgo.toISOString())

          if (error) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Unable to check rate limit status.",
                },
              ],
            }
          }

          const currentCount = count || 0
          const remaining = Math.max(0, 5 - currentCount)

          return {
            content: [
              {
                type: "text",
                text:
                  `📊 Rate Limit Status:\n\n` +
                  `🌐 IP Address: ${ip}\n` +
                  `📈 Requests in last minute: ${currentCount}/5\n` +
                  `⏳ Remaining requests: ${remaining}\n` +
                  `🔄 Window resets: Every minute\n\n` +
                  `${remaining === 0 ? "⚠️ Rate limit reached! Please wait before making more requests." : "✅ You can make more requests."}`,
              },
            ],
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Internal server error while checking rate limit.",
              },
            ],
          }
        }
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
        }
    }
  },
})

export const { GET, POST } = handler
