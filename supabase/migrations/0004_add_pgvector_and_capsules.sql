-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Add an embedding column to wardrobe_items (OpenAI text-embedding-3-small generates 1536 dimensions)
alter table wardrobe_items add column embedding vector(1536);

-- Create a function to similarity search for wardrobe items
create or replace function match_wardrobe_items (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  similarity float
)
language sql stable
as $$
  select
    wardrobe_items.id,
    1 - (wardrobe_items.embedding <=> query_embedding) as similarity
  from wardrobe_items
  where wardrobe_items.user_id = p_user_id
    and wardrobe_items.is_active = true
    and wardrobe_items.embedding is not null
    and 1 - (wardrobe_items.embedding <=> query_embedding) > match_threshold
  order by wardrobe_items.embedding <=> query_embedding
  limit match_count;
$$;

-- Create Capsules Table
create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  destinations text,
  days int,
  bag_size text,
  reasoning text,
  created_at timestamptz default now()
);

-- Create Capsule Items Table
create table if not exists public.capsule_items (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid references public.capsules(id) on delete cascade,
  wardrobe_item_id uuid references public.wardrobe_items(id) on delete cascade,
  is_core_item boolean default false,
  item_reasoning text
);

-- Enable RLS on new tables
alter table public.capsules enable row level security;
alter table public.capsule_items enable row level security;

-- RLS Policies
create policy "Users can view own capsules"
  on public.capsules for select
  using (auth.uid() = user_id);

create policy "Users can insert own capsules"
  on public.capsules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own capsules"
  on public.capsules for update
  using (auth.uid() = user_id);

create policy "Users can delete own capsules"
  on public.capsules for delete
  using (auth.uid() = user_id);

-- For capsule_items, join through capsules for RLS
create policy "Users can view own capsule items"
  on public.capsule_items for select
  using (
    exists (
      select 1 from public.capsules c
      where c.id = capsule_items.capsule_id
      and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own capsule items"
  on public.capsule_items for insert
  with check (
    exists (
      select 1 from public.capsules c
      where c.id = capsule_items.capsule_id
      and c.user_id = auth.uid()
    )
  );

create policy "Users can delete own capsule items"
  on public.capsule_items for delete
  using (
    exists (
      select 1 from public.capsules c
      where c.id = capsule_items.capsule_id
      and c.user_id = auth.uid()
    )
  );
