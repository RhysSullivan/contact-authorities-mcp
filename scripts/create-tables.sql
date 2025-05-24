-- Create contact_events table for production database
CREATE TABLE IF NOT EXISTS contact_events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    target VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- Create rate_limits table for persistent rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    ip_address VARCHAR(45) PRIMARY KEY,
    request_count INT DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_window_start (window_start)
);
