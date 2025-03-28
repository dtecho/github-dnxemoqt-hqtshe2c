/*
  # Create memories schema

  1. New Tables
    - `memories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `content` (text)
      - `tags` (text array)
      - `embedding` (vector, 1536-dimensional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `metadata` (jsonb)
      - `context` (text)
      - `type` (text)
    
  2. Security
    - Enable RLS on `memories` table
    - Add policies for authenticated users to manage their own memories
*/

-- Create vector extension if it doesn't exist
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
  type text DEFAULT 'memory'
);

-- Create index for faster vector similarity searches
CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS memories_type_idx ON memories(type);

-- Enable row level security
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own memories"
  ON memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own memories"
  ON memories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON memories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function for similarity search
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
    AND (filter_type IS NULL OR memories.type = filter_type)
    AND 1 - (memories.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;