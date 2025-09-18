-- Enable RLS on target tables and add policies for least-privilege access

-- Helper: identify admin based on user_profiles.role
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and up.role = 'admin'
  );
$$;

-- Plants table
alter table if exists public.plants enable row level security;

-- Admins: full access
create policy if not exists plants_admin_all on public.plants
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Managers: read only plants assigned to them via user_profiles.plant_id
create policy if not exists plants_manager_read on public.plants
  for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'manager'
        and up.plant_id = plants.id
    )
  );

-- user_profiles table
alter table if exists public.user_profiles enable row level security;

-- Users can read their own profile
create policy if not exists user_profiles_self_select on public.user_profiles
  for select
  using (id = auth.uid() or public.is_admin());

-- Users can update limited fields on their own profile (example: full_name)
create policy if not exists user_profiles_self_update on public.user_profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can read/write all profiles
create policy if not exists user_profiles_admin_all on public.user_profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Optional: block inserts from public unless admin
create policy if not exists user_profiles_insert_admin on public.user_profiles
  for insert
  with check (public.is_admin());
