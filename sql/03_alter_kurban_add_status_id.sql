-- Check if status_id column exists and update it if needed
DO $$
BEGIN
    -- Check if status_id column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'kurban'
        AND column_name = 'status_id'
    ) THEN
        -- Update existing records to have a default status if they don't have one
        UPDATE kurban
        SET status_id = (SELECT id FROM kurban_statuses WHERE name = 'waiting')
        WHERE status_id IS NULL;

        -- Make sure the column is NOT NULL
        ALTER TABLE kurban ALTER COLUMN status_id SET NOT NULL;
    ELSE
        -- Add status_id column if it doesn't exist
        ALTER TABLE kurban ADD COLUMN status_id UUID REFERENCES kurban_statuses(id);

        -- Update existing records to have a default status
        UPDATE kurban
        SET status_id = (SELECT id FROM kurban_statuses WHERE name = 'waiting')
        WHERE status_id IS NULL;

        -- Make status_id column required
        ALTER TABLE kurban ALTER COLUMN status_id SET NOT NULL;
    END IF;
END $$;

-- Add index for faster lookups if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'kurban'
        AND indexname = 'idx_kurban_status_id'
    ) THEN
        CREATE INDEX idx_kurban_status_id ON kurban(status_id);
    END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Allow public read access" ON kurban;
DROP POLICY IF EXISTS "Allow staff and admin full access" ON kurban;

CREATE POLICY "Allow public read access" ON kurban
    FOR SELECT
    USING (true);

CREATE POLICY "Allow staff and admin full access" ON kurban
    FOR ALL
    USING (auth.role() = 'authenticated' AND auth.email() IN (
        SELECT email FROM users WHERE role IN ('admin', 'staff')
    ));