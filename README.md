# Contact Authorities MCP Server

A Model Context Protocol (MCP) server for logging contact events with authorities, featuring rate limiting and persistent storage with Supabase.

## Features

- **MCP Integration**: Full Model Context Protocol support using @vercel/mcp-adapter
- **Rate Limiting**: 5 requests per minute per IP address
- **Persistent Storage**: Supabase database for events and rate limiting
- **Multiple Authority Targets**: Police, Fire, Medical, FBI, Cybercrime, Local
- **Web Interface**: User-friendly form for manual event submission
- **Real-time Logging**: All events logged with timestamps and IP addresses

## MCP Tools

### `contact_authorities`
Log a contact event with authorities.

**Parameters:**
- `title` (string, required): Brief title describing the incident
- `target` (string, required): Authority target (police, fire, medical, fbi, cybercrime, local)
- `description` (string, required): Detailed description of the contact reason

### `get_contact_events`
Retrieve recent contact authority events.

**Parameters:**
- `limit` (number, optional): Maximum events to retrieve (default: 20, max: 100)
- `target` (string, optional): Filter by authority target

### `get_rate_limit_status`
Check current rate limit status for the requesting IP.

## Setup

1. **Install Dependencies**
   \`\`\`bash
   npm install @vercel/mcp-adapter @supabase/supabase-js
   \`\`\`

2. **Environment Variables**
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   \`\`\`

3. **Database Setup**
   Run the SQL scripts in your Supabase project to create the required tables.

4. **MCP Client Configuration**
   Add to your MCP client configuration:
   \`\`\`json
   {
     "mcpServers": {
       "contact-authorities": {
         "transport": {
           "type": "http",
           "url": "https://your-domain.com/api/mcp"
         }
       }
     }
   }
   \`\`\`

## Usage

### Via MCP Client
AI models can use the MCP tools to:
- Log contact events with authorities
- Retrieve recent events
- Check rate limit status

### Via Web Interface
Users can manually submit contact events through the web form at the root URL.

## Rate Limiting

- 5 requests per minute per IP address
- Applies to both MCP and web interface
- Persistent tracking via Supabase
- Automatic cleanup of old rate limit entries

## Security

- Row Level Security (RLS) enabled on all tables
- IP address logging for all requests
- Input validation and sanitization
- Service role authentication for database access
