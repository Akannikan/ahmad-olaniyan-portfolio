-- Run this once in the Supabase SQL Editor.
-- Replace every REPLACE_WITH_ADMIN_USER_UUID with your Supabase Auth user UUID.
-- That same UUID must be set as VITE_ADMIN_USER_ID locally and in Vercel.

create table if not exists public.portfolio_content (
  id text primary key check (id = 'main'),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'portfolio_content'
  ) then
    alter publication supabase_realtime add table public.portfolio_content;
  end if;
end
$$;

alter table public.portfolio_content enable row level security;
grant select on public.portfolio_content to anon, authenticated;
grant insert, update on public.portfolio_content to authenticated;

drop policy if exists "Public can read portfolio content" on public.portfolio_content;
create policy "Public can read portfolio content"
  on public.portfolio_content for select
  using (id = 'main');

drop policy if exists "Configured admin can insert portfolio content" on public.portfolio_content;
create policy "Configured admin can insert portfolio content"
  on public.portfolio_content for insert to authenticated
  with check (
    id = 'main'
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  );

drop policy if exists "Configured admin can update portfolio content" on public.portfolio_content;
create policy "Configured admin can update portfolio content"
  on public.portfolio_content for update to authenticated
  using (auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid)
  with check (
    id = 'main'
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'portfolio-documents-public',
    'portfolio-documents-public',
    true,
    26214400,
    array[
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/svg+xml', 'image/svg', 'video/mp4',
      'application/octet-stream'
    ]
  ),
  (
    'portfolio-documents-private',
    'portfolio-documents-private',
    false,
    26214400,
    array[
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/svg+xml', 'image/svg', 'video/mp4',
      'application/octet-stream'
    ]
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '' check (char_length(description) <= 1000),
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_extension text not null check (file_extension in ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'svg', 'mp4')),
  file_type text not null,
  file_size bigint not null check (file_size between 1 and 26214400),
  storage_path text not null unique,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint documents_extension_matches_mime check (
    (file_extension = 'pdf' and file_type = 'application/pdf')
    or (file_extension = 'doc' and file_type in ('application/msword', 'application/octet-stream'))
    or (file_extension = 'docx' and file_type in ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'))
    or (file_extension = 'xls' and file_type in ('application/vnd.ms-excel', 'application/octet-stream'))
    or (file_extension = 'xlsx' and file_type in ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'))
    or (file_extension = 'ppt' and file_type in ('application/vnd.ms-powerpoint', 'application/octet-stream'))
    or (file_extension = 'pptx' and file_type in ('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/octet-stream'))
    or (file_extension in ('jpg', 'jpeg') and file_type = 'image/jpeg')
    or (file_extension = 'png' and file_type = 'image/png')
    or (file_extension = 'svg' and file_type in ('image/svg+xml', 'image/svg'))
    or (file_extension = 'mp4' and file_type = 'video/mp4')
  ),
  constraint documents_path_matches_visibility check (
    storage_path ~ '^[0-9a-fA-F-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|svg|mp4)$'
  )
);

alter table public.documents enable row level security;
grant select on public.documents to anon, authenticated;
grant insert, update, delete on public.documents to authenticated;

drop policy if exists "Public can read public documents" on public.documents;
create policy "Public can read public documents"
  on public.documents for select
  using (is_public or auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid);

drop policy if exists "Configured admin can insert documents" on public.documents;
create policy "Configured admin can insert documents"
  on public.documents for insert to authenticated
  with check (
    auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
    and exists (
      select 1
      from storage.objects
      where name = storage_path
        and bucket_id = case when is_public then 'portfolio-documents-public' else 'portfolio-documents-private' end
    )
  );

drop policy if exists "Configured admin can update documents" on public.documents;
create policy "Configured admin can update documents"
  on public.documents for update to authenticated
  using (auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid)
  with check (
    auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
    and exists (
      select 1
      from storage.objects
      where name = storage_path
        and bucket_id = case when is_public then 'portfolio-documents-public' else 'portfolio-documents-private' end
    )
  );

drop policy if exists "Configured admin can delete documents" on public.documents;
create policy "Configured admin can delete documents"
  on public.documents for delete to authenticated
  using (auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid);

drop policy if exists "Public can view portfolio assets" on storage.objects;
create policy "Public can view portfolio assets"
  on storage.objects for select
  using (bucket_id = 'portfolio-assets');

drop policy if exists "Configured admin can upload portfolio assets" on storage.objects;
create policy "Configured admin can upload portfolio assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  );

drop policy if exists "Configured admin can update portfolio assets" on storage.objects;
create policy "Configured admin can update portfolio assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  )
  with check (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  );

drop policy if exists "Configured admin can delete portfolio assets" on storage.objects;
create policy "Configured admin can delete portfolio assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  );

drop policy if exists "Public can view public portfolio documents" on storage.objects;
create policy "Public can view public portfolio documents"
  on storage.objects for select
  using (bucket_id = 'portfolio-documents-public');

drop policy if exists "Configured admin can view private portfolio documents" on storage.objects;
create policy "Configured admin can view private portfolio documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'portfolio-documents-private'
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  );

drop policy if exists "Configured admin can upload portfolio documents" on storage.objects;
create policy "Configured admin can upload portfolio documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('portfolio-documents-public', 'portfolio-documents-private')
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
    and name ~* '^[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|svg|mp4)$'
    and coalesce((metadata->>'size')::bigint, 0) between 1 and 26214400
    and metadata->>'mimetype' in (
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/svg+xml', 'image/svg', 'video/mp4',
      'application/octet-stream'
    )
    and case lower(split_part(name, '.', -1))
      when 'pdf' then metadata->>'mimetype' = 'application/pdf'
      when 'doc' then metadata->>'mimetype' in ('application/msword', 'application/octet-stream')
      when 'docx' then metadata->>'mimetype' in ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream')
      when 'xls' then metadata->>'mimetype' in ('application/vnd.ms-excel', 'application/octet-stream')
      when 'xlsx' then metadata->>'mimetype' in ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream')
      when 'ppt' then metadata->>'mimetype' in ('application/vnd.ms-powerpoint', 'application/octet-stream')
      when 'pptx' then metadata->>'mimetype' in ('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/octet-stream')
      when 'jpg' then metadata->>'mimetype' = 'image/jpeg'
      when 'jpeg' then metadata->>'mimetype' = 'image/jpeg'
      when 'png' then metadata->>'mimetype' = 'image/png'
      when 'svg' then metadata->>'mimetype' in ('image/svg+xml', 'image/svg')
      when 'mp4' then metadata->>'mimetype' = 'video/mp4'
      else false
    end
  );

drop policy if exists "Configured admin can update portfolio documents" on storage.objects;
create policy "Configured admin can update portfolio documents"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('portfolio-documents-public', 'portfolio-documents-private')
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  )
  with check (
    bucket_id in ('portfolio-documents-public', 'portfolio-documents-private')
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
    and name ~* '^[0-9a-f-]{36}\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|svg|mp4)$'
    and coalesce((metadata->>'size')::bigint, 0) between 1 and 26214400
  );

drop policy if exists "Configured admin can delete portfolio documents" on storage.objects;
create policy "Configured admin can delete portfolio documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('portfolio-documents-public', 'portfolio-documents-private')
    and auth.uid() = 'REPLACE_WITH_ADMIN_USER_UUID'::uuid
  );
