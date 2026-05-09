-- ENABLE EXTENSIONS SO THAT SUPABASE UNDERSTANDS VECTORS AND HANDLES INDEXING
create extension if not exists vector;

--DOCUMENTS TABLE
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  file_url text not null,
  content text,               -- The extracted text from Gemini
  category text,
  topic text default 'general',
  user_id uuid references auth.users(id),
  user_email text not null,   -- Used for the search filter
  embedding vector(3072),     -- Optimized for gemini-embedding-2
  created_at timestamp with time zone default timezone('utc'::text, now())
);

--SEMANTIC SEARCH FUNCTION (RPC)
create or replace function match_documents (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_user_email text
)
returns table (
  id uuid,
  file_name text,
  content text,
  similarity float,
  category text,
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
    documents.category,
    documents.user_email
  from documents
  where documents.user_email = p_user_email 
    and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

--ENABLE ROW LEVEL SECURITY
alter table documents enable row level security;

--INSERT POLICY
create policy "Users can insert their own documents"
on documents for insert
to authenticated
with check ( auth.uid() = user_id );

--SELECT POLICY
create policy "Users can view their own documents"
on documents for select
to authenticated
using ( auth.uid() = user_id );

--DELETE POLICY
create policy "Users can delete their own documents"
on documents for delete
to authenticated
using ( auth.uid() = user_id );

--ENABLE RLS. NAME THE BUCKET "documents". You can do this in the supabase dashboard by following the path Storage > Buckets > [Your Bucket] > Settings
--POLICIES FOR STORAGE BUCKET
-- 1. ALLOW USERS TO UPLOAD FILES
-- Users can only upload to a folder named after their own UID
create policy "Users can upload their own documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. ALLOW USERS TO VIEW THEIR FILES
create policy "Users can view their own documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. ALLOW USERS TO DELETE THEIR FILES
create policy "Users can delete their own documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);