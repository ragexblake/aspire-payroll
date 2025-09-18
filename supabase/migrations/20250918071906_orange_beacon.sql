/*
  # Create employees table

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `employee_id` (text, unique, not null)
      - `full_name` (text, not null)
      - `email` (text, nullable)
      - `phone` (text, nullable)
      - `department` (text, nullable)
      - `position` (text, nullable)
      - `hire_date` (date, nullable)
      - `salary` (numeric, nullable)
      - `plant_id` (uuid, foreign key to plants)
      - `manager_id` (uuid, foreign key to user_profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `employees` table
    - Add policies for authenticated users to read employee data
    - Add policies for managers to manage their own employees
*/

CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    employee_id text UNIQUE NOT NULL,
    full_name text NOT NULL,
    email text,
    phone text,
    department text,
    position text,
    hire_date date,
    salary numeric,
    plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE NOT NULL,
    manager_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read employee data
CREATE POLICY "Enable read access for all authenticated users" ON public.employees FOR SELECT TO authenticated USING (true);

-- Allow managers to insert their own employees
CREATE POLICY "Enable insert for managers" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = manager_id);

-- Allow managers to update their own employees
CREATE POLICY "Enable update for managers" ON public.employees FOR UPDATE TO authenticated USING (auth.uid() = manager_id);

-- Allow managers to delete their own employees
CREATE POLICY "Enable delete for managers" ON public.employees FOR DELETE TO authenticated USING (auth.uid() = manager_id);