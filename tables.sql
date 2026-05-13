-- ==========================================
-- DOCUINTEL MASTER SETUP SCRIPT
-- Updated for May 2026 Supabase Security Standards
-- ==========================================

-- 1. ENABLE EXTENSIONS
-- These are required for vector math and UUID generation
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- 2. CREATE DOCUMENTS TABLE
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  file_url text not null,
  content text,               -- The extracted text from Gemini
  category text,
  topic text default 'general',
  user_id uuid references auth.users(id),
  user_email text not null,   -- Used for the search filter
  embedding vector(3072),     -- Optimized for gemini-embedding-2 (3,072-dim)
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. NEW: EXPLICIT GRANTS (Fixes 42501 Permission Errors)
-- Required by Supabase for all new projects starting May 30
grant select, insert, update, delete on table public.documents to authenticated;
grant all on table public.documents to service_role;

-- 4. ENABLE ROW LEVEL SECURITY (DATABASE)
alter table public.documents enable row level security;

-- 5. DATABASE POLICIES
create policy "Users can insert their own documents"
on public.documents for insert to authenticated
with check ( auth.uid() = user_id );

create policy "Users can view their own documents"
on public.documents for select to authenticated
using ( auth.uid() = user_id );

create policy "Users can delete their own documents"
on public.documents for delete to authenticated
using ( auth.uid() = user_id );

-- 6. STORAGE BUCKET SETUP
-- This creates the 'documents' bucket automatically if it doesn't exist
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- 7. STORAGE POLICIES (Hardened Folder-Level Security)
-- This ensures User A cannot access files in User B's folder
create policy "Users can upload their own documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 8. SEMANTIC SEARCH FUNCTION (RPC)
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

-- 9. GRANT EXECUTE ON FUNCTION (Crucial for API access)
grant execute on function public.match_documents to authenticated;
grant execute on function public.match_documents to service_role;