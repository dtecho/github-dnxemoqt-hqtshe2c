/*
  # System Schema for Deep Tree Echo Workspace

  1. Database Structure
     - Vector extension for memory embeddings
     - Memory storage with vector search capabilities
     - System health monitoring
     - Orchestration event tracking
     
  2. Security
     - Row level security policies for user data protection
     - Authentication integration with Supabase auth
     
  3. Functions
     - Vector similarity search for memory retrieval
*/

-- Create vector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure memories table exists with correct structure
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON public.memories USING btree (user_id);
CREATE INDEX IF NOT EXISTS memories_type_idx ON public.memories USING btree (type);
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON public.memories USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');

-- Enable Row Level Security on memories table
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Create the match_memories function if it doesn't exist
CREATE OR REPLACE FUNCTION match_memories(
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

-- Create or update RLS policies for memories table

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

-- Enable RLS on system_health
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view system_health
DROP POLICY IF EXISTS "Authenticated users can view system health" ON public.system_health;
CREATE POLICY "Authenticated users can view system health"
  ON public.system_health
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to add system health
DROP POLICY IF EXISTS "Authenticated users can add system health" ON public.system_health;
CREATE POLICY "Authenticated users can add system health"
  ON public.system_health
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- Enable RLS on orchestration_events
ALTER TABLE public.orchestration_events ENABLE ROW LEVEL SECURITY;

-- Users can create orchestration events
DROP POLICY IF EXISTS "Users can create orchestration events" ON public.orchestration_events;
CREATE POLICY "Users can create orchestration events"
  ON public.orchestration_events
  FOR INSERT
  TO authenticated
  WITH CHECK ((user_id IS NULL) OR (auth.uid() = user_id));

-- Allow users to view their own orchestration_events
DROP POLICY IF EXISTS "Users view their own orchestration events" ON public.orchestration_events;
CREATE POLICY "Users view their own orchestration events"
  ON public.orchestration_events
  FOR SELECT
  TO authenticated
  USING ((user_id IS NULL) OR (auth.uid() = user_id));