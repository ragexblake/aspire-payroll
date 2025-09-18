-- Create employees table for CSV import and management

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  full_name text not null,
  email text,
  phone text,
  department text,
  position text,
  hire_date date,
  salary numeric(10,2),
  plant_id uuid references public.plants(id) on delete cascade,
  manager_id uuid references public.user_profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Add indexes for performance
create index if not exists idx_employees_plant_id on public.employees(plant_id);
create index if not exists idx_employees_manager_id on public.employees(manager_id);
create index if not exists idx_employees_employee_id on public.employees(employee_id);

-- Enable RLS
alter table public.employees enable row level security;

-- Helper function to check if user is manager of plant
create or replace function public.is_manager_of_plant(plant_uuid uuid)
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
      and up.role = 'manager'
      and up.plant_id = plant_uuid
  );
$$;

-- RLS Policies for employees table

-- Admins: full access
create policy if not exists employees_admin_all on public.employees
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Managers: can read/write employees in their assigned plant
create policy if not exists employees_manager_plant on public.employees
  for all
  using (public.is_manager_of_plant(plant_id))
  with check (public.is_manager_of_plant(plant_id));

-- Users can read their own employee record (if they have one)
create policy if not exists employees_self_read on public.employees
  for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.email = employees.email
    )
  );
