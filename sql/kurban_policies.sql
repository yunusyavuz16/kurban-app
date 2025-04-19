-- Enable RLS on kurban table
ALTER TABLE kurban ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS kurban_select ON kurban;
DROP POLICY IF EXISTS kurban_insert ON kurban;
DROP POLICY IF EXISTS kurban_update ON kurban;
DROP POLICY IF EXISTS kurban_delete ON kurban;

-- Create policies
-- Allow all authenticated users to view kurbans
CREATE POLICY kurban_select ON kurban
  FOR SELECT
  USING (true);

-- Allow staff and admin to insert new kurbans
CREATE POLICY kurban_insert ON kurban
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'staff' OR users.role = 'admin')
    )
  );

-- Allow staff and admin to update kurbans
CREATE POLICY kurban_update ON kurban
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'staff' OR users.role = 'admin')
    )
  );

-- Allow only admin to delete kurbans
CREATE POLICY kurban_delete ON kurban
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );


  -- Allow staff and admin to insert new kurbans
CREATE POLICY kurban_insert ON kurban
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()  -- Check against the authenticated user's ID
      AND (users.role = 'staff' OR users.role = 'admin') -- Check role in the 'users' table
    )
  );