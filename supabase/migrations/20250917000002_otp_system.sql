-- OTP system for manager profile operations

-- Create OTP table for verification codes
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  admin_id uuid references auth.users(id) on delete cascade,
  operation_type text not null check (operation_type in ('add_manager', 'delete_manager')),
  target_data jsonb, -- stores manager data for add operations, manager_id for delete
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_otp_codes_admin_id on public.otp_codes(admin_id);
create index if not exists idx_otp_codes_code on public.otp_codes(code);
create index if not exists idx_otp_codes_expires_at on public.otp_codes(expires_at);

-- Enable RLS
alter table public.otp_codes enable row level security;

-- Only admins can read their own OTP codes
create policy if not exists otp_codes_admin_read on public.otp_codes
  for select
  using (admin_id = auth.uid() and public.is_admin());

-- Only admins can insert OTP codes
create policy if not exists otp_codes_admin_insert on public.otp_codes
  for insert
  with check (admin_id = auth.uid() and public.is_admin());

-- Only admins can update their own OTP codes (for marking as used)
create policy if not exists otp_codes_admin_update on public.otp_codes
  for update
  using (admin_id = auth.uid() and public.is_admin())
  with check (admin_id = auth.uid() and public.is_admin());

-- Function to generate OTP code
create or replace function public.generate_otp(
  p_admin_id uuid,
  p_operation_type text,
  p_target_data jsonb default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  otp_code text;
  expires_at timestamp with time zone;
begin
  -- Generate 6-digit OTP
  otp_code := lpad(floor(random() * 1000000)::text, 6, '0');
  
  -- Set expiration to 10 minutes from now
  expires_at := now() + interval '10 minutes';
  
  -- Insert OTP record
  insert into public.otp_codes (code, admin_id, operation_type, target_data, expires_at)
  values (otp_code, p_admin_id, p_operation_type, p_target_data, expires_at);
  
  return otp_code;
end;
$$;

-- Function to verify OTP code
create or replace function public.verify_otp(
  p_code text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  otp_record record;
  result jsonb;
begin
  -- Find valid OTP code
  select * into otp_record
  from public.otp_codes
  where code = p_code
    and admin_id = p_admin_id
    and used_at is null
    and expires_at > now();
  
  if not found then
    return jsonb_build_object('valid', false, 'message', 'Invalid or expired OTP code');
  end if;
  
  -- Mark as used
  update public.otp_codes
  set used_at = now()
  where id = otp_record.id;
  
  -- Return success with operation details
  result := jsonb_build_object(
    'valid', true,
    'operation_type', otp_record.operation_type,
    'target_data', otp_record.target_data
  );
  
  return result;
end;
$$;

-- Function to clean up expired OTP codes (can be run periodically)
create or replace function public.cleanup_expired_otp()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.otp_codes
  where expires_at < now() - interval '1 hour';
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
