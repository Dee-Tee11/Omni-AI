-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- The 'documents' table already exists in your schema.
-- We will create a new table 'document_chunks' to store the vectors and link them to 'documents'.

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  user_id text not null, -- Redundant but useful for RLS/Filtering speed
  content text,
  embedding vector(1024), -- Cohere Embed v3 Multimodal uses 1024 dimensions
  metadata jsonb, -- Stores page number, image path, etc.
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create an index for faster similarity search
create index on document_chunks using ivfflat (embedding vector_cosine_ops)
with
  (lists = 100);

-- Create a function to search for document chunks
create or replace function match_document_chunks (
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_user_id text
) returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql stable as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  and document_chunks.user_id = filter_user_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
