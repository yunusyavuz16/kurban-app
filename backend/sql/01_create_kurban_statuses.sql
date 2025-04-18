-- backend/sql/01_create_kurban_statuses.sql

-- Create kurban_statuses table
CREATE TABLE IF NOT EXISTS kurban_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    color_bg VARCHAR(50) NOT NULL,
    color_text VARCHAR(50) NOT NULL,
    color_border VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE kurban_statuses ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON kurban_statuses
    FOR SELECT
    USING (true);

-- Allow admin full access
CREATE POLICY "Allow admin full access" ON kurban_statuses
    FOR ALL
    USING (auth.role() = 'authenticated' AND auth.email() IN (
        SELECT email FROM users WHERE role = 'admin'
    ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kurban_statuses_updated_at
    BEFORE UPDATE ON kurban_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add index for faster lookups by name or order
CREATE INDEX idx_kurban_statuses_name ON kurban_statuses(name);
CREATE INDEX idx_kurban_statuses_display_order ON kurban_statuses(display_order);

-- Insert initial statuses matching the old hardcoded ones
INSERT INTO kurban_statuses (name, label, color_bg, color_text, color_border, display_order) VALUES
('waiting', 'Beklemede', '!bg--yellow-50', 'text-yellow-900', 'border-yellow-300', 10),
('slaughtering', 'Kesimde', '!bg--red-50', 'text-red-900', 'border-red-300', 20),
('skinning', 'Yüzme İşleminde', '!bg--orange-50', 'text-orange-900', 'border-orange-300', 30),
('meat_separation', 'Et Ayrımında', '!bg--purple-50', 'text-purple-900', 'border-purple-300', 40),
('weighing', 'Tartıda', '!bg--blue-50', 'text-blue-900', 'border-blue-300', 50),
('packaging', 'Paketlemede', '!bg--green-50', 'text-green-900', 'border-green-300', 60),
('done', 'Tamamlandı', '!bg--gray-50', 'text-gray-900', 'border-gray-300', 70);