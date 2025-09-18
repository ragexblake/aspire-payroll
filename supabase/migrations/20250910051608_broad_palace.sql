/*
  # Initial Payroll Platform Schema

  1. New Tables
    - `plants`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `location` (text)
      - `created_at` (timestamp)
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `email` (text, unique)
      - `role` (enum: 'admin', 'manager')
      - `plant_id` (uuid, references plants, nullable for admin)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Admins can access all plants and users
    - Managers can only access their assigned plant and their own profile
    - Public users cannot access any data without authentication

  3. Indexes
    - Index on email for faster lookups
    - Index on plant_id for manager queries
*/

-- Create plants table
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager')),
  plant_id uuid REFERENCES plants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_plant_id_idx ON user_profiles(plant_id);

-- Enable Row Level Security
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plants table
CREATE POLICY "Admins can access all plants"
  ON plants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Managers can view their assigned plant"
  ON plants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'manager'
      AND user_profiles.plant_id = plants.id
    )
  );

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can access all user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Insert sample plants
INSERT INTO plants (name, location) VALUES
  ('Manufacturing Plant A', 'New York, NY'),
  ('Manufacturing Plant B', 'Los Angeles, CA'),
  ('Manufacturing Plant C', 'Chicago, IL')
ON CONFLICT (name) DO NOTHING;