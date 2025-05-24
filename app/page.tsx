"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, Server, Code } from "lucide-react"

interface ContactEvent {
  id: string
  title: string
  target: string
  description: string
  timestamp: string
  ip: string
}

export default function ContactAuthoritiesPage() {
  const [events, setEvents] = useState<ContactEvent[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    target: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/contact-authorities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Contact event logged successfully!" })
        setFormData({ title: "", target: "", description: "" })
        // Refresh events
        fetchEvents()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to log event" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/contact-authorities")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }

  // Fetch events on component mount
  React.useEffect(() => {
    fetchEvents()
  }, [])

  const mcpEndpoint = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "/api/mcp"

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-red-800 flex items-center justify-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Contact Authorities MCP Server
          </h1>
          <p className="text-red-600">Emergency contact logging with Model Context Protocol support</p>
        </div>

        {/* MCP Server Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Server className="h-5 w-5" />
              MCP Server Configuration
            </CardTitle>
            <CardDescription>
              This server implements the Model Context Protocol for AI model integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-blue-700">MCP Endpoint</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono">{mcpEndpoint}</code>
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(mcpEndpoint)}>
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-blue-700">Available Tools</Label>
                <div className="mt-1 space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    contact_authorities
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    get_contact_events
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    get_rate_limit_status
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-100 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Code className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">MCP Client Configuration:</p>
                  <p className="text-xs mt-1">
                    Add this server to your MCP client configuration to enable AI model access to the contact
                    authorities system.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contact Form */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Log Contact Event</CardTitle>
              <CardDescription>
                Submit a new contact request to authorities (Rate limited: 5 per minute)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the incident"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Authority Target</Label>
                  <Select
                    value={formData.target}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, target: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select authority to contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="police">Police Department</SelectItem>
                      <SelectItem value="fire">Fire Department</SelectItem>
                      <SelectItem value="medical">Emergency Medical</SelectItem>
                      <SelectItem value="fbi">FBI</SelectItem>
                      <SelectItem value="cybercrime">Cybercrime Unit</SelectItem>
                      <SelectItem value="local">Local Authorities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Contact Reason</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of why authorities need to be contacted..."
                    rows={4}
                    required
                  />
                </div>

                {message && (
                  <Alert
                    className={message.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}
                  >
                    {message.type === "error" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.target || !formData.description}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? "Logging Event..." : "Contact Authorities"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Events Log */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Contact Events
              </CardTitle>
              <CardDescription>Latest authority contact requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events logged yet</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {event.target}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        <span>IP: {event.ip}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">Rate Limiting & Security Notice</p>
                <p className="text-xs text-yellow-700">
                  This system is rate limited to 5 requests per minute per IP address to prevent abuse. All contact
                  events are logged with timestamps and IP addresses for security purposes. The MCP server provides the
                  same rate limiting for AI model access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
