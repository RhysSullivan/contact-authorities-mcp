import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Code, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MCPInstructions } from "./mcp-instructions";

export const revalidate = 60;

export default async function ContactAuthoritiesPage() {
  const { data: events, error } = await supabase
    .from("contact_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // Transform data to match frontend expectations
  const transformedEvents = events?.map((event) => ({
    id: event.id,
    title: event.title,
    target: event.target,
    description: event.description,
    timestamp: event.created_at,
    ip: event.ip_address,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-red-800 flex items-center justify-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Contact Authorities MCP Server
          </h1>
          <p className="text-red-600">
            Emergency contact logging with Model Context Protocol support
          </p>
        </div>
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
              {transformedEvents?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No events logged yet
                </p>
              ) : (
                transformedEvents?.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {event.target}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <MCPInstructions />

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">
                  Rate Limiting & Security Notice
                </p>
                <p className="text-xs text-yellow-700">
                  This system is rate limited to 5 requests per minute per IP
                  address to prevent abuse. All contact events are logged with
                  timestamps and IP addresses for security purposes. The MCP
                  server provides the same rate limiting for AI model access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
