-- Insert sample venues in Ahmedabad, Gujarat
INSERT INTO venues (venue_name, owner_id, location, city, state, zip_code, description, capacity, price_per_event, amenities, contact_name, contact_phone, contact_email, booking_advance_days, status) 
VALUES 
('Grand Banquet Hall', 1, 'Satellite', 'Ahmedabad', 'Gujarat', '380015', 'Spacious banquet hall with modern facilities', 500, 50000, 'AC, Catering, Parking, Sound System', 'Rajesh Patel', '9876543210', 'grand@eventsync.com', 30, 'active'),
('Royal Celebration Palace', 1, 'Vastrapur', 'Ahmedabad', 'Gujarat', '380001', 'Luxury venue for weddings and celebrations', 800, 75000, 'AC, Catering, Valet Parking, Stage Setup', 'Priya Sharma', '9876543211', 'royal@eventsync.com', 30, 'active'),
('Crystal Event Space', 1, 'Memnagar', 'Ahmedabad', 'Gujarat', '380006', 'Modern event venue with flexible setup', 400, 40000, 'AC, Catering, WiFi, Parking', 'Amit Kumar', '9876543212', 'crystal@eventsync.com', 30, 'active'),
('Sunshine Manor', 1, 'Thaltej', 'Ahmedabad', 'Gujarat', '380059', 'Traditional venue for cultural events', 350, 35000, 'AC, Catering, Mandap Setup', 'Sneha Gupta', '9876543213', 'sunshine@eventsync.com', 30, 'active'),
('The Dream Venue', 1, 'SG Highway', 'Ahmedabad', 'Gujarat', '380060', 'Contemporary event space', 600, 60000, 'AC, Catering, Projector, Stage', 'Vikram Singh', '9876543214', 'dream@eventsync.com', 30, 'active');
