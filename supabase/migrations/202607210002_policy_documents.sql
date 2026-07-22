create table if not exists public.policy_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  extracted_text text,
  summary jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists policy_documents_user_created_idx
  on public.policy_documents (user_id, created_at desc);

alter table public.policy_documents enable row level security;

drop policy if exists "Users can read their policy documents" on public.policy_documents;
create policy "Users can read their policy documents" on public.policy_documents
  for select using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their policy documents" on public.policy_documents;
create policy "Users can insert their policy documents" on public.policy_documents
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their policy documents" on public.policy_documents;
create policy "Users can delete their policy documents" on public.policy_documents
  for delete using ((select auth.uid()) = user_id);

create or replace function public.touch_policy_document_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists policy_documents_set_updated_at on public.policy_documents;
create trigger policy_documents_set_updated_at
  before update on public.policy_documents
  for each row execute procedure public.touch_policy_document_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'policy-documents',
  'policy-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their policy files" on storage.objects;
create policy "Users can read their policy files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can upload their policy files" on storage.objects;
create policy "Users can upload their policy files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their policy files" on storage.objects;
create policy "Users can delete their policy files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'policy-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
