-- Run this in the Supabase SQL editor, then run seed.sql.
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null default 'Graphic Design',
  year text not null default '',
  summary text not null default '',
  cover_image text not null default '',
  accent text not null default '#DDF48B',
  tags text[] not null default '{}',
  tools text[] not null default '{}',
  behance_url text not null default '',
  featured boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  content_blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.allowed_admins (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists projects_status_order_idx on public.projects (status, sort_order);

alter table public.site_settings enable row level security;
alter table public.projects enable row level security;
alter table public.allowed_admins enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select using (true);

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects" on public.projects for select using (status = 'published');

-- Writes use the server-only service-role key after allowlist verification.
-- No public insert/update/delete policies are intentionally created.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml','video/mp4','video/webm','video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public portfolio media read" on storage.objects;
create policy "Public portfolio media read" on storage.objects
for select using (bucket_id = 'portfolio-media');

-- Add the email used for Supabase magic-link sign-in:
-- insert into public.allowed_admins (email) values ('rashichugh610@gmail.com');
