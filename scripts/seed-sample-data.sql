-- Insert some sample contact events for testing
INSERT INTO contact_events (id, title, target, description, ip_address, created_at) VALUES
('event_sample_1', 'Suspicious Activity Report', 'police', 'Observed unusual behavior in the neighborhood around 2 AM. Multiple individuals gathering near the park.', '192.168.1.100', NOW() - INTERVAL 2 HOUR),
('event_sample_2', 'Cybersecurity Incident', 'cybercrime', 'Detected unauthorized access attempts on company servers. Multiple failed login attempts from foreign IP addresses.', '10.0.0.50', NOW() - INTERVAL 1 HOUR),
('event_sample_3', 'Emergency Medical Situation', 'medical', 'Elderly neighbor appears to need immediate medical attention. Not responding to door knocks.', '192.168.1.101', NOW() - INTERVAL 30 MINUTE);

-- Note: In production, you might want to clean up old rate limit entries
-- DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL 1 HOUR;
