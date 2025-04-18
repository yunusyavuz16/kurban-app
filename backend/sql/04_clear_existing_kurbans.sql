-- Clear existing kurban records
DELETE FROM kurban;

-- Reset sequence if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'kurban_id_seq') THEN
        ALTER SEQUENCE kurban_id_seq RESTART WITH 1;
    END IF;
END $$;