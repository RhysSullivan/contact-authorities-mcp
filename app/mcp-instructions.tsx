"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Code, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const mcpConfig = `{
    "mcpServers": {
      "nark-mcp": {
        "command": "npx",
        "args": ["mcp-remote", "https://narkmcp.vercel.app/api/mcp"]
      }
    }
  }`;
export function MCPInstructions() {
    
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Code className="h-5 w-5" />
          MCP Configuration
        </CardTitle>
        <CardDescription>
          Instructions for configuring your MCP client
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-700 mb-2">
          Add the following to your MCP configuration file (e.g.,{" "}
          <code>~/.mcp/config.json</code>):
        </p>
        <div className="relative">
          <pre className="bg-gray-800 text-white p-3 pr-12 rounded-md text-xs overflow-x-auto">
            <code>{mcpConfig}</code>
          </pre>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={async () => {
              await navigator.clipboard.writeText(mcpConfig);
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
