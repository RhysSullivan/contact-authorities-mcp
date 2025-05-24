-- Create contact_events table
CREATE TABLE IF NOT EXISTS contact_events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    target VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_events_created_at ON contact_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_events_ip_address ON contact_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_contact_events_target ON contact_events(target);

-- Create rate_limits table for persistent rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_created ON rate_limits(ip_address, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_events (allow all operations for service role)
CREATE POLICY "Enable all operations for service role" ON contact_events
    FOR ALL USING (true);

-- Create policies for rate_limits (allow all operations for service role)
CREATE POLICY "Enable all operations for service role" ON rate_limits
    FOR ALL USING (true);

-- Create a function to clean up old rate limit entries (optional)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits 
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- You can set up a cron job to run this cleanup function periodically
-- SELECT cron.schedule('cleanup-rate-limits', '*/30 * * * *', 'SELECT cleanup_old_rate_limits();');
