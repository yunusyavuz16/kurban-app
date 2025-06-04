-- Kurban Management System Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organization table
CREATE TABLE IF NOT EXISTS organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    settings JSON DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for organization
CREATE INDEX IF NOT EXISTS organization_code_idx ON organization(code);
CREATE INDEX IF NOT EXISTS organization_is_active_idx ON organization(is_active);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(10) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'viewer')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    metadata JSON DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_organization_id_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active);

-- Create kurban_statuses table
CREATE TABLE IF NOT EXISTS kurban_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    color_bg VARCHAR(50) NOT NULL,
    color_text VARCHAR(50) NOT NULL,
    color_border VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

-- Create indexes for kurban_statuses
CREATE INDEX IF NOT EXISTS kurban_statuses_organization_id_idx ON kurban_statuses(organization_id);
CREATE INDEX IF NOT EXISTS kurban_statuses_name_idx ON kurban_statuses(name);
CREATE INDEX IF NOT EXISTS kurban_statuses_display_order_idx ON kurban_statuses(display_order);
CREATE INDEX IF NOT EXISTS kurban_statuses_is_active_idx ON kurban_statuses(is_active);

-- Create kurban table
CREATE TABLE IF NOT EXISTS kurban (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no VARCHAR(50) NOT NULL,
    order_number INTEGER NOT NULL,
    weight DECIMAL(10, 2),
    notes TEXT,
    slaughter_time TIMESTAMP WITH TIME ZONE,
    butcher_name VARCHAR(255),
    package_count INTEGER,
    meat_pieces JSON,
    status_id UUID NOT NULL REFERENCES kurban_statuses(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    breed VARCHAR(100),
    age INTEGER,
    color VARCHAR(100),
    gender VARCHAR(6) CHECK (gender IN ('male', 'female')),
    owner_name VARCHAR(255),
    owner_phone VARCHAR(20),
    owner_address TEXT,
    blood_weight DECIMAL(10, 2),
    hide_weight DECIMAL(10, 2),
    organ_weight DECIMAL(10, 2),
    net_meat_weight DECIMAL(10, 2),
    metadata JSON DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, no),
    UNIQUE(organization_id, order_number)
);

-- Create indexes for kurban
CREATE INDEX IF NOT EXISTS kurban_organization_id_idx ON kurban(organization_id);
CREATE INDEX IF NOT EXISTS kurban_status_id_idx ON kurban(status_id);
CREATE INDEX IF NOT EXISTS kurban_order_number_idx ON kurban(order_number);
CREATE INDEX IF NOT EXISTS kurban_no_idx ON kurban(no);
CREATE INDEX IF NOT EXISTS kurban_is_active_idx ON kurban(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_organization_updated_at ON organization;
CREATE TRIGGER update_organization_updated_at
    BEFORE UPDATE ON organization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kurban_statuses_updated_at ON kurban_statuses;
CREATE TRIGGER update_kurban_statuses_updated_at
    BEFORE UPDATE ON kurban_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kurban_updated_at ON kurban;
CREATE TRIGGER update_kurban_updated_at
    BEFORE UPDATE ON kurban
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurban_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurban ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization (public read, authenticated admin/staff write)
DROP POLICY IF EXISTS "Allow public read access" ON organization;
CREATE POLICY "Allow public read access" ON organization
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin full access" ON organization;
CREATE POLICY "Allow admin full access" ON organization
    FOR ALL
    USING (true); -- For demo purposes, allow all operations

-- Create RLS policies for users
DROP POLICY IF EXISTS "Allow public read access" ON users;
CREATE POLICY "Allow public read access" ON users
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin full access" ON users;
CREATE POLICY "Allow admin full access" ON users
    FOR ALL
    USING (true); -- For demo purposes, allow all operations

-- Create RLS policies for kurban_statuses
DROP POLICY IF EXISTS "Allow public read access" ON kurban_statuses;
CREATE POLICY "Allow public read access" ON kurban_statuses
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin full access" ON kurban_statuses;
CREATE POLICY "Allow admin full access" ON kurban_statuses
    FOR ALL
    USING (true); -- For demo purposes, allow all operations

-- Create RLS policies for kurban
DROP POLICY IF EXISTS "Allow public read access" ON kurban;
CREATE POLICY "Allow public read access" ON kurban
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin full access" ON kurban;
CREATE POLICY "Allow admin full access" ON kurban
    FOR ALL
    USING (true); -- For demo purposes, allow all operations

-- Print success message
SELECT 'All tables created successfully!' as message;