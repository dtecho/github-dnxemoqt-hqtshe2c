/*
  # Database Schema for Deep Tree Echo
  
  1. Tables
    - memories with vector embeddings
    - system_health for monitoring
    - orchestration_events for tracking
    
  2. Security
    - RLS policies with proper checks
    - Vector operations setup
*/

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  context text,
  type text DEFAULT 'memory'::text
);

-- Create system health table
CREATE TABLE IF NOT EXISTS system_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operational_status text NOT NULL,
  memory_usage double precision NOT NULL,
  active_connections integer NOT NULL,
  last_check timestamptz DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb,
  created_by text DEFAULT 'system'::text
);

-- Create orchestration events table
CREATE TABLE IF NOT EXISTS orchestration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  description text NOT NULL,
  component text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  timestamp timestamptz DEFAULT now(),
  data jsonb DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS memories_type_idx ON memories(type);
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own memories" ON memories;
  DROP POLICY IF EXISTS "Users can create their own memories" ON memories;
  DROP POLICY IF EXISTS "Users can update their own memories" ON memories;
  DROP POLICY IF EXISTS "Users can delete their own memories" ON memories;
  DROP POLICY IF EXISTS "Authenticated users can view system health" ON system_health;
  DROP POLICY IF EXISTS "Authenticated users can add system health" ON system_health;
  DROP POLICY IF EXISTS "Users can create orchestration events" ON orchestration_events;
  DROP POLICY IF EXISTS "Users view their own orchestration events" ON orchestration_events;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for memories
CREATE POLICY "Users can view their own memories"
  ON memories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
  ON memories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON memories FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON memories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for system_health
CREATE POLICY "Authenticated users can view system health"
  ON system_health FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add system health"
  ON system_health FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policies for orchestration_events
CREATE POLICY "Users can create orchestration events"
  ON orchestration_events FOR INSERT TO authenticated
  WITH CHECK ((user_id IS NULL) OR (auth.uid() = user_id));

CREATE POLICY "Users view their own orchestration events"
  ON orchestration_events FOR SELECT TO authenticated
  USING ((user_id IS NULL) OR (auth.uid() = user_id));

-- Create vector similarity search function
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