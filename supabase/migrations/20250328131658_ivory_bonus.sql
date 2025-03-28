/*
  # Add Orchestrator Role and Enhanced Policies

  1. Changes
    - Create orchestrator role with elevated permissions
    - Add specialized policies for system management
    - Set up vector operation policies
    
  2. Security
    - Maintain existing RLS
    - Add new orchestrator-specific policies
*/

-- Create orchestrator role function
CREATE OR REPLACE FUNCTION create_orchestrator_role() 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if role exists
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orchestrator') THEN
    -- Create the role
    CREATE ROLE orchestrator WITH LOGIN PASSWORD 'secure_password_here' CREATEROLE CREATEDB;
    COMMENT ON ROLE orchestrator IS 'System orchestrator role with elevated permissions for Deep Tree Echo system';
  END IF;
END $$;

-- Execute the function
SELECT create_orchestrator_role();

-- Drop existing orchestrator policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Orchestrator can view all memories" ON memories;
  DROP POLICY IF EXISTS "Orchestrator can create any memories" ON memories;
  DROP POLICY IF EXISTS "Orchestrator can update any memories" ON memories;
  DROP POLICY IF EXISTS "Orchestrator can delete any memories" ON memories;
  DROP POLICY IF EXISTS "Orchestrator manages system health" ON system_health;
  DROP POLICY IF EXISTS "Orchestrator manages orchestration events" ON orchestration_events;
  DROP POLICY IF EXISTS "Orchestrator can perform vector operations" ON memories;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create orchestrator-specific policies
CREATE POLICY "Orchestrator can view all memories"
  ON memories FOR SELECT TO orchestrator
  USING (true);

CREATE POLICY "Orchestrator can create any memories"
  ON memories FOR INSERT TO orchestrator
  WITH CHECK (true);

CREATE POLICY "Orchestrator can update any memories"
  ON memories FOR UPDATE TO orchestrator
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Orchestrator can delete any memories"
  ON memories FOR DELETE TO orchestrator
  USING (true);

CREATE POLICY "Orchestrator manages system health"
  ON system_health FOR ALL TO orchestrator
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Orchestrator manages orchestration events"
  ON orchestration_events FOR ALL TO orchestrator
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Orchestrator can perform vector operations"
  ON memories FOR ALL TO orchestrator
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO orchestrator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO orchestrator;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO orchestrator;
GRANT ALL ON SCHEMA public TO orchestrator;

-- Set up default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON TABLES TO orchestrator;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO orchestrator;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON FUNCTIONS TO orchestrator;