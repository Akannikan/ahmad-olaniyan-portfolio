-- Run this once in the Supabase SQL Editor.
-- Replace the UUID below with the ID of your own Supabase Auth user.
-- The same UUID must be set as VITE_ADMIN_USER_ID in local and Vercel environment variables.

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
    and auth.uid() = 'e40fa548-a5a8-44ef-89ac-dddcde2431f5'::uuid
  );

drop policy if exists "Configured admin can update portfolio content" on public.portfolio_content;
create policy "Configured admin can update portfolio content"
  on public.portfolio_content for update to authenticated
  using (auth.uid() = 'e40fa548-a5a8-44ef-89ac-dddcde2431f5'::uuid)
  with check (
    id = 'main'
    and auth.uid() = 'e40fa548-a5a8-44ef-89ac-dddcde2431f5'::uuid
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

drop policy if exists "Public can view portfolio assets" on storage.objects;
create policy "Public can view portfolio assets"
  on storage.objects for select
  using (bucket_id = 'portfolio-assets');

drop policy if exists "Configured admin can upload portfolio assets" on storage.objects;
create policy "Configured admin can upload portfolio assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'e40fa548-a5a8-44ef-89ac-dddcde2431f5'::uuid
  );

drop policy if exists "Configured admin can update portfolio assets" on storage.objects;
create policy "Configured admin can update portfolio assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'e40fa548-a5a8-44ef-89ac-dddcde2431f5'::uuid
  )
  with check (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'e40fa548-a5a8-44ef-89ac-dddcde2431f5'::uuid
  );

drop policy if exists "Configured admin can delete portfolio assets" on storage.objects;
create policy "Configured admin can delete portfolio assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and auth.uid() = 'e40fa548-a5a8-44ef-89ac-dddcde2431f5'::uuid
  );
