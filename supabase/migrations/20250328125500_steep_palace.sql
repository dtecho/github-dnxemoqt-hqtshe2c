/*
  # Enhance Memory System with Vector Search

  1. Changes
    - Add vector embeddings column
    - Create vector similarity search function
    - Add vector index for fast similarity search
    
  2. Security
    - Maintain existing RLS policies
    - Add policy for vector operations
*/

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector embeddings column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memories' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE memories ADD COLUMN embedding vector(1536);
  END IF;
END $$;

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

-- Create vector index for fast similarity search if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'memories_embedding_idx'
  ) THEN
    CREATE INDEX memories_embedding_idx ON memories 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  END IF;
END $$;

-- Add policy for vector operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memories' AND policyname = 'Users can perform vector operations on their memories'
  ) THEN
    CREATE POLICY "Users can perform vector operations on their memories"
      ON memories
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;