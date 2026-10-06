create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  source text not null,
  chunk_index int not null,
  content text not null,
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_fts_idx on documents using gin (fts);
create index if not exists documents_embedding_idx on documents using hnsw (embedding vector_cosine_ops);
create index if not exists documents_source_idx on documents (source);

alter table documents enable row level security;

create or replace function hybrid_search(
  query_text text,
  query_embedding vector(768),
  match_count int default 6,
  keyword_weight float default 1,
  semantic_weight float default 1,
  rrf_k int default 50
)
returns table (
  id bigint,
  source text,
  content text,
  keyword_rank int,
  semantic_rank int,
  keyword_score float,
  semantic_score float,
  rrf_score float
)
language sql stable
as $$
  with keyword as (
    select d.id,
      ts_rank_cd(d.fts, q) as score,
      row_number() over (order by ts_rank_cd(d.fts, q) desc) as rank
    from documents d, websearch_to_tsquery('english', query_text) q
    where d.fts @@ q
    order by rank
    limit match_count * 2
  ),
  semantic as (
    select d.id,
      1 - (d.embedding <=> query_embedding) as score,
      row_number() over (order by d.embedding <=> query_embedding) as rank
    from documents d
    order by rank
    limit match_count * 2
  )
  select d.id, d.source, d.content,
    k.rank::int, s.rank::int,
    coalesce(k.score, 0)::float, coalesce(s.score, 0)::float,
    (coalesce(keyword_weight / (rrf_k + k.rank), 0) + coalesce(semantic_weight / (rrf_k + s.rank), 0))::float
  from keyword k
  full outer join semantic s on k.id = s.id
  join documents d on d.id = coalesce(k.id, s.id)
  order by 8 desc
  limit match_count;
$$;
