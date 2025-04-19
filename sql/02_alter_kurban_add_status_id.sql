-- backend/sql/02_alter_kurban_add_status_id.sql

-- Add the new status_id column to the kurban table
ALTER TABLE kurban
ADD COLUMN status_id UUID;

-- Update existing rows to link to the new statuses based on the old text status
-- This requires the kurban_statuses table to be populated first (done in 01_create_kurban_statuses.sql)
UPDATE kurban k
SET status_id = ks.id
FROM kurban_statuses ks
WHERE k.status = ks.name; -- Match based on the old status text

-- Add the foreign key constraint
ALTER TABLE kurban
ADD CONSTRAINT fk_kurban_status
FOREIGN KEY (status_id)
REFERENCES kurban_statuses(id)
ON DELETE RESTRICT; -- Prevent deleting a status if kurbans are using it

-- Make the status_id column NOT NULL after populating it
-- Ensure all existing kurbans were successfully updated before running this
-- Or set a DEFAULT status if applicable
-- It might be safer to add a default status first

-- Find the ID for the 'waiting' status to use as default
-- Note: This assumes 'waiting' exists and is the desired default.
-- A more robust approach might involve a function or check.
DO $$
DECLARE
  default_status_id UUID;
BEGIN
  SELECT id INTO default_status_id FROM kurban_statuses WHERE name = 'waiting' LIMIT 1;

  -- Set a default value for status_id
  EXECUTE format('ALTER TABLE kurban ALTER COLUMN status_id SET DEFAULT %L', default_status_id);

  -- Now update NULL values that might exist if the initial update missed some
  UPDATE kurban SET status_id = default_status_id WHERE status_id IS NULL;

  -- Finally, make the column NOT NULL
  ALTER TABLE kurban ALTER COLUMN status_id SET NOT NULL;
END $$;


-- Drop the old status column
ALTER TABLE kurban
DROP COLUMN status;

-- Optional: Add an index on the new status_id column for faster filtering
CREATE INDEX idx_kurban_status_id ON kurban(status_id);