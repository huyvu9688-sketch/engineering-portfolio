-- Projects -----------------------------------------------------------------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Documents ----------------------------------------------------------------
create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  category          text not null check (category in
                      ('cad_3d','drawing_2d','datasheet','standard','report','image')),
  file_ext          text not null,
  mime_type         text,
  size_bytes        bigint not null,
  tags              text[] not null default '{}',
  project_id        uuid references public.projects(id) on delete set null,
  storage_path      text not null unique,
  original_filename text not null,
  search            tsvector generated always as (
                      to_tsvector('english',
                        coalesce(title,'') || ' ' ||
                        coalesce(description,'') || ' ' ||
                        array_to_string(tags,' '))) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index documents_search_idx   on public.documents using gin (search);
create index documents_tags_idx     on public.documents using gin (tags);
create index documents_category_idx on public.documents (category);
create index documents_project_idx  on public.documents (project_id);
create index documents_created_idx  on public.documents (created_at desc);

-- Admin allow-list ---------------------------------------------------------
create table public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- is_admin(): security definer so it can read app_admins under RLS ---------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- updated_at trigger -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Row-Level Security -------------------------------------------------------
alter table public.projects   enable row level security;
alter table public.documents  enable row level security;
alter table public.app_admins enable row level security;

create policy "projects public read"  on public.projects  for select using (true);
create policy "documents public read" on public.documents for select using (true);

create policy "projects admin write"  on public.projects
  for all using (public.is_admin()) with check (public.is_admin());
create policy "documents admin write" on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

create policy "app_admins admin read" on public.app_admins
  for select using (public.is_admin());
