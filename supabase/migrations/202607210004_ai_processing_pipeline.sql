-- Durable AI processing jobs and auditable analysis runs.
alter table public.policy_documents
  add column if not exists content_sha256 text;

create index if not exists policy_documents_user_hash_idx
  on public.policy_documents (user_id, content_sha256)
  where content_sha256 is not null;

create table if not exists public.policy_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.policy_documents(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists policy_processing_jobs_claim_idx
  on public.policy_processing_jobs (status, available_at, created_at);

alter table public.policy_processing_jobs enable row level security;

create table if not exists public.policy_ai_runs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.policy_documents(id) on delete cascade,
  job_id uuid references public.policy_processing_jobs(id) on delete set null,
  provider text not null,
  model text not null,
  role text not null check (role in ('fast', 'reasoning', 'cache')),
  prompt_version text not null,
  status text not null check (status in ('completed', 'failed')),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  escalated boolean not null default false,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists policy_ai_runs_document_idx
  on public.policy_ai_runs (document_id, created_at desc);

alter table public.policy_ai_runs enable row level security;

create or replace function public.claim_policy_processing_job(worker_name text)
returns setof public.policy_processing_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id uuid;
begin
  select id into claimed_id
  from public.policy_processing_jobs
  where (
      status = 'queued'
      and available_at <= now()
    ) or (
      status = 'processing'
      and locked_at < now() - interval '10 minutes'
    )
  order by available_at, created_at
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  return query
  update public.policy_processing_jobs
  set status = 'processing',
      attempts = attempts + 1,
      locked_at = now(),
      locked_by = worker_name,
      last_error = null,
      updated_at = now()
  where id = claimed_id
  returning *;
end;
$$;

revoke all on function public.claim_policy_processing_job(text) from public, anon, authenticated;
grant execute on function public.claim_policy_processing_job(text) to service_role;
