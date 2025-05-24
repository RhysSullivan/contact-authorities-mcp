import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function getRealIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to request IP
  return request.ip || "unknown"
}

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
      // Allow request if we can't check rate limit
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
    // Allow request if rate limiting fails
    return { allowed: true, remaining: maxRequests - 1 }
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getRealIP(request)

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 5 requests per minute.",
          rateLimitExceeded: true,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + 60),
          },
        },
      )
    }

    const body = await request.json()
    const { title, target, description } = body

    // Validate required fields
    if (!title || !target || !description) {
      return NextResponse.json({ error: "Missing required fields: title, target, description" }, { status: 400 })
    }

    // Create new contact event
    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: String(title).trim(),
      target: String(target).trim(),
      description: String(description).trim(),
      ip_address: ip,
    }

    // Insert into Supabase
    const { data, error } = await supabase.from("contact_events").insert(newEvent).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to log contact event" }, { status: 500 })
    }

    console.log(`[CONTACT AUTHORITIES] New event logged:`, {
      id: data.id,
      title: data.title,
      target: data.target,
      ip: data.ip_address,
      timestamp: data.created_at,
    })

    return NextResponse.json(
      {
        success: true,
        eventId: data.id,
        message: "Contact event logged successfully",
      },
      {
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + 60),
        },
      },
    )
  } catch (error) {
    console.error("Error processing contact request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getRealIP(request)

    // Apply rate limiting to GET requests too
    const { allowed, remaining } = await checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Fetch recent events from Supabase
    const { data: events, error } = await supabase
      .from("contact_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    // Transform data to match frontend expectations
    const transformedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      target: event.target,
      description: event.description,
      timestamp: event.created_at,
      ip: event.ip_address,
    }))

    return NextResponse.json(
      {
        events: transformedEvents,
        total: events.length,
      },
      {
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    )
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
