-- Main document table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_name text NOT NULL,
  file_url TEXT,  
  category text,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(), 
  user_email TEXT
);

-- Granular segments table
CREATE TABLE document_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT,
  page_number INTEGER,
  paragraph_number INTEGER,
  user_email TEXT,
  tsv_content tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

CREATE INDEX idx_segments_fts ON document_segments USING GIN(tsv_content);
-- Re-create the table with a robust FTS column definition
-- WARNING: This will delete all existing data in the table.
-- If you have data, only run the ALTER TABLE command below.

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp WITH time zone DEFAULT now(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  content text NOT NULL, 
  topic text,
  category text,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  tsv_content tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED
);

-- If the table already exists, just modify the column:
-- ALTER TABLE documents 
-- DROP COLUMN tsv_content;
-- ALTER TABLE documents 
-- ADD COLUMN tsv_content tsvector 
-- GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED; 

-- Don't forget the index!
CREATE INDEX IF NOT EXISTS documents_tsv_idx ON documents USING GIN (tsv_content);

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents (user_id);


-- 2. ENABLE ROW-LEVEL SECURITY (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Ensure that nobody can accidentally access data if policies fail (recommended)
ALTER TABLE documents FORCE ROW LEVEL SECURITY;


-- 3. CREATE POLICIES

-- Policy 1: SELECT (Read Access)
-- Allows a user to view documents ONLY IF the document's user_id matches their authenticated user ID (auth.uid()).
CREATE POLICY "Users can only view their own documents."
ON documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: INSERT (Write Access)
-- Allows an authenticated user to insert a new document, and automatically sets the user_id column
-- to the currently logged-in user's ID.
CREATE POLICY "Users can insert their own documents."
ON documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- Policy 3: UPDATE (Edit Access)
-- Allows a user to update a document ONLY IF the document's user_id matches their authenticated user ID.
CREATE POLICY "Users can update their own documents."
ON documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

create policy "Enable insert for users based on user_id"
on "public"."documents"
as PERMISSIVE
for INSERT
to public
with check (
  (select auth.uid()) = user_id
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

create extension if not exists vector;

alter table documents add column if not exists embedding vector(768);

create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  file_name text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.file_name,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- 1. Drop the old column (this will delete existing embeddings, but you can re-index)
alter table documents drop column if exists embedding;

-- 2. Add the column back with the correct dimensions for Gemini 2
alter table documents add column embedding vector(3072);

-- 3. Update your match_documents function to accept 3072
create or replace function match_documents (
  query_embedding vector(3072), -- Change this from 768 to 3072
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  file_name text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.file_name,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- adds a p_user_email parameter and a WHERE clause to filter the results.
create or replace function match_documents (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_user_email text  -- New parameter for the user's email
)
returns table (
  id uuid,
  file_name text,
  content text,
  similarity float,
  user_email text
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.file_name,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity,
    documents.user_email
  from documents
  -- This line ensures security by filtering for the logged-in user
  where documents.user_email = p_user_email 
    and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;