-- Migration: Add package_lpa column to placement_history table
-- Requirement 1: Non-destructive addition of package_lpa NUMERIC(8,2), nullable to accommodate historical records

ALTER TABLE placement_history 
ADD COLUMN IF NOT EXISTS package_lpa NUMERIC(8,2) DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN placement_history.package_lpa IS 'Package offered to the student in Lakhs Per Annum (LPA). Nullable for historical records.';

-- Optional helper RPC function to refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
