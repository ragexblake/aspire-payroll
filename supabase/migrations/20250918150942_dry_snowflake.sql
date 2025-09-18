/*
  # Create OTP verification system

  1. New Tables
    - `otp_codes`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key to user_profiles)
      - `otp_code` (text, 6-digit code)
      - `operation_type` (text, type of operation)
      - `target_data` (jsonb, operation data)
      - `expires_at` (timestamptz, expiration time)
      - `created_at` (timestamptz, creation time)
      - `used` (boolean, whether OTP has been used)

  2. Security
    - Enable RLS on `otp_codes` table
    - Add policy for admins to manage their own OTP codes

  3. Functions
    - `generate_otp` - Creates new OTP codes
    - `verify_otp` - Verifies and consumes OTP codes
*/

-- Create the otp_codes table
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    otp_code text NOT NULL,
    operation_type text NOT NULL,
    target_data jsonb,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    used boolean DEFAULT FALSE NOT NULL
);

-- Enable Row Level Security (RLS) for otp_codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for otp_codes
CREATE POLICY "Admins can manage their own OTP codes" ON public.otp_codes
FOR ALL USING (auth.uid() = admin_id);

-- Create the generate_otp function
CREATE OR REPLACE FUNCTION public.generate_otp(
    p_admin_id uuid,
    p_operation_type text,
    p_target_data jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp_code text;
BEGIN
    -- Generate a 6-digit OTP
    v_otp_code := lpad(floor(random() * 1000000)::text, 6, '0');

    -- Invalidate any existing unused OTPs for this admin and operation type
    UPDATE public.otp_codes
    SET used = TRUE
    WHERE admin_id = p_admin_id
      AND operation_type = p_operation_type
      AND used = FALSE
      AND expires_at > now();

    -- Insert the new OTP
    INSERT INTO public.otp_codes (admin_id, otp_code, operation_type, target_data, expires_at)
    VALUES (p_admin_id, v_otp_code, p_operation_type, p_target_data, now() + interval '10 minutes');

    RETURN v_otp_code;
END;
$$;

-- Grant usage and execute permissions for generate_otp
GRANT EXECUTE ON FUNCTION public.generate_otp(uuid, text, jsonb) TO authenticated;

-- Create the verify_otp function
CREATE OR REPLACE FUNCTION public.verify_otp(
    p_code text,
    p_admin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_otp_record public.otp_codes;
    v_result jsonb;
BEGIN
    SELECT *
    INTO v_otp_record
    FROM public.otp_codes
    WHERE admin_id = p_admin_id
      AND otp_code = p_code
      AND used = FALSE
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_record IS NOT NULL THEN
        -- Mark the OTP as used
        UPDATE public.otp_codes
        SET used = TRUE
        WHERE id = v_otp_record.id;

        v_result := jsonb_build_object(
            'valid', TRUE,
            'message', 'OTP verified successfully',
            'operation_type', v_otp_record.operation_type,
            'target_data', v_otp_record.target_data
        );
    ELSE
        v_result := jsonb_build_object(
            'valid', FALSE,
            'message', 'Invalid or expired OTP'
        );
    END IF;

    RETURN v_result;
END;
$$;

-- Grant usage and execute permissions for verify_otp
GRANT EXECUTE ON FUNCTION public.verify_otp(text, uuid) TO authenticated;