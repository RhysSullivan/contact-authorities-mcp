-- Insert sample contact events for testing
INSERT INTO contact_events (id, title, target, description, ip_address, created_at) VALUES
('event_sample_1', 'Suspicious Activity Report', 'police', 'Observed unusual behavior in the neighborhood around 2 AM. Multiple individuals gathering near the park.', '192.168.1.100', NOW() - INTERVAL '2 hours'),
('event_sample_2', 'Cybersecurity Incident', 'cybercrime', 'Detected unauthorized access attempts on company servers. Multiple failed login attempts from foreign IP addresses.', '10.0.0.50', NOW() - INTERVAL '1 hour'),
('event_sample_3', 'Emergency Medical Situation', 'medical', 'Elderly neighbor appears to need immediate medical attention. Not responding to door knocks.', '192.168.1.101', NOW() - INTERVAL '30 minutes'),
('event_sample_4', 'Fire Safety Concern', 'fire', 'Smoke detected coming from abandoned building. Potential fire hazard in residential area.', '172.16.0.25', NOW() - INTERVAL '15 minutes'),
('event_sample_5', 'Federal Investigation Request', 'fbi', 'Discovered evidence of potential interstate criminal activity. Requires federal investigation.', '203.0.113.45', NOW() - INTERVAL '5 minutes');

-- Clean up any old rate limit entries
DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 hour';
