-- OTP codes for privileged actions (add/delete manager)

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.user_profiles(id) on delete cascade,
  purpose text not null check (purpose in ('add_manager', 'delete_manager')),
  code text not null,
  payload jsonb,
  expires_at timestamp with time zone not null,
  consumed boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_otp_admin_id on public.otp_codes(admin_id);
create index if not exists idx_otp_expires_at on public.otp_codes(expires_at);

alter table public.otp_codes enable row level security;

-- Only the admin who created the code can see their codes; admins can create
create policy if not exists otp_codes_insert_admin on public.otp_codes
  for insert
  with check (public.is_admin() and admin_id = auth.uid());

create policy if not exists otp_codes_select_self on public.otp_codes
  for select
  using (admin_id = auth.uid());

create policy if not exists otp_codes_update_self on public.otp_codes
  for update
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());


