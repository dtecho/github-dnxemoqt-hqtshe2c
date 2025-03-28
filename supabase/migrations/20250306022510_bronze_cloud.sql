/*
  # Database Migration for Deep Tree Echo System
  
  1. Tables Setup
    - Ensures memories table with structure and vector support
    - Creates system_health and orchestration_events tables
    - Sets up appropriate indexes including vector embedding index
  
  2. Security and RLS
    - Configures row level security for all tables
    - Sets up comprehensive CRUD policies for different user types
    - Secures sensitive system information

  3. Vector Search
    - Creates match_memories function for semantic similarity search
*/

-- Ensure vector extension is installed
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  context text,
  type text DEFAULT 'memory'::text
);

-- Create system health table to track system status
CREATE TABLE IF NOT EXISTS public.system_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operational_status text NOT NULL,
  memory_usage float NOT NULL,
  active_connections int NOT NULL,
  last_check timestamptz DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb,
  created_by text DEFAULT 'system'
);

-- Create orchestration events table to track system events
CREATE TABLE IF NOT EXISTS public.orchestration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  description text NOT NULL,
  component text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  timestamp timestamptz DEFAULT now(),
  data jsonb DEFAULT '{}'::jsonb
);

-- Ensure indexes exist for memories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'memories_user_id_idx'
  ) THEN
    CREATE INDEX memories_user_id_idx ON public.memories USING btree (user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'memories_type_idx'
  ) THEN
    CREATE INDEX memories_type_idx ON public.memories USING btree (type);
  END IF;
  
  -- Only create embedding index if vector extension is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'memories_embedding_idx'
  ) THEN
    CREATE INDEX memories_embedding_idx ON public.memories USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');
  END IF;
END
$$;

-- Enable Row Level Security on all tables
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orchestration_events ENABLE ROW LEVEL SECURITY;

-- Create match_memories function for semantic search
CREATE OR REPLACE FUNCTION public.match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id uuid,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.content,
    memories.metadata,
    1 - (memories.embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE 
    memories.user_id = match_memories.user_id
    AND (memories.embedding <=> query_embedding) < (1 - match_threshold)
    AND (filter_type IS NULL OR memories.type = filter_type)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Setup RLS policies for memories table
-- Policy for users to select their own memories
DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
CREATE POLICY "Users can view their own memories"
  ON public.memories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own memories
DROP POLICY IF EXISTS "Users can create their own memories" ON public.memories;
CREATE POLICY "Users can create their own memories"
  ON public.memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own memories
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
CREATE POLICY "Users can update their own memories"
  ON public.memories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own memories
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;
CREATE POLICY "Users can delete their own memories"
  ON public.memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Setup RLS policies for system_health
DROP POLICY IF EXISTS "Authenticated users can view system health" ON public.system_health;
CREATE POLICY "Authenticated users can view system health"
  ON public.system_health
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for inserting system health data
DROP POLICY IF EXISTS "Authenticated users can add system health" ON public.system_health;
CREATE POLICY "Authenticated users can add system health"
  ON public.system_health
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Setup RLS policies for orchestration_events
-- Policy for users to view their own orchestration_events
DROP POLICY IF EXISTS "Users view their own orchestration events" ON public.orchestration_events;
CREATE POLICY "Users view their own orchestration events"
  ON public.orchestration_events
  FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Policy for users to insert orchestration events
DROP POLICY IF EXISTS "Users can create orchestration events" ON public.orchestration_events;
CREATE POLICY "Users can create orchestration events"
  ON public.orchestration_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Create admin role function that can be run by Supabase admin
CREATE OR REPLACE FUNCTION public.create_orchestrator_role() 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if role exists
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orchestrator') THEN
    -- Create the role
    EXECUTE 'CREATE ROLE orchestrator WITH LOGIN PASSWORD ''secure_password_here'' CREATEROLE CREATEDB';
    EXECUTE 'COMMENT ON ROLE orchestrator IS ''System orchestrator role with elevated permissions for Deep Tree Echo system''';
    
    -- Grant permissions
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO orchestrator';
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO orchestrator';
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO orchestrator';
    EXECUTE 'GRANT ALL ON SCHEMA public TO orchestrator';
    EXECUTE 'GRANT USAGE ON SCHEMA auth TO orchestrator';
    EXECUTE 'GRANT SELECT ON ALL TABLES IN SCHEMA auth TO orchestrator';
    
    -- Setup default privileges
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO orchestrator';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO orchestrator';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO orchestrator';
    
    -- Create additional policies for orchestrator role
    EXECUTE 'CREATE POLICY "Orchestrator can view all memories" ON public.memories FOR SELECT TO orchestrator USING (true)';
    EXECUTE 'CREATE POLICY "Orchestrator can create any memories" ON public.memories FOR INSERT TO orchestrator WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Orchestrator can update any memories" ON public.memories FOR UPDATE TO orchestrator USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Orchestrator can delete any memories" ON public.memories FOR DELETE TO orchestrator USING (true)';
    
    EXECUTE 'CREATE POLICY "Orchestrator manages system health" ON public.system_health FOR ALL TO orchestrator USING (true) WITH CHECK (true)';
    
    EXECUTE 'CREATE POLICY "Orchestrator manages orchestration events" ON public.orchestration_events FOR ALL TO orchestrator USING (true) WITH CHECK (true)';
    
    -- Set object ownership
    EXECUTE 'ALTER TABLE public.memories OWNER TO postgres';
    EXECUTE 'ALTER TABLE public.system_health OWNER TO postgres';
    EXECUTE 'ALTER TABLE public.orchestration_events OWNER TO postgres';
    EXECUTE 'ALTER FUNCTION match_memories OWNER TO postgres';
  END IF;
END;
$$;

-- Execute the function to create the orchestrator role safely
SELECT public.create_orchestrator_role();

-- Grant usage of the function to anon/authenticated roles
GRANT EXECUTE ON FUNCTION public.create_orchestrator_role TO anon, authenticated;

-- Optionally drop the function after it's been used (uncomment if needed)
-- DROP FUNCTION IF EXISTS public.create_orchestrator_role();