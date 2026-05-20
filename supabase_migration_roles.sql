-- =============================================
-- NUTRIMETH ERP - Role System Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add role column to user_profiles if it doesn't exist
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee'
    CHECK (role IN ('super_admin','admin','manager','hr','accountant','inventory_manager','sales_manager','employee'));

-- 2. Add department column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 3. Add employee_id column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- 4. Add position column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS position TEXT;

-- 5. Add salary column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12,2) DEFAULT 0;

-- 6. Add hire_date column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS hire_date DATE;

-- 7. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present','late','absent','leave')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  office_id TEXT,
  hours_worked NUMERIC(4,2),
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create office_locations table (for GPS geo-fencing)
CREATE TABLE IF NOT EXISTS office_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER DEFAULT 200,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES user_profiles(id),
  assigned_by UUID REFERENCES user_profiles(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies — employees see own data, admins/hr see all
CREATE POLICY IF NOT EXISTS "Users can view their own attendance"
  ON attendance FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid()
    AND role IN ('super_admin','admin','hr','manager')
  ));

CREATE POLICY IF NOT EXISTS "Users can insert their own attendance"
  ON attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view their own leaves"
  ON leave_requests FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid()
    AND role IN ('super_admin','admin','hr','manager')
  ));

CREATE POLICY IF NOT EXISTS "Users can insert leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "HR/Admin can update leave requests"
  ON leave_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid()
    AND role IN ('super_admin','admin','hr','manager')
  ));

-- 13. Set first user as super_admin if needed (update as required)
-- UPDATE user_profiles SET role = 'super_admin' WHERE email = 'your-admin@email.com';

-- =============================================
-- Migration complete! Paste this in Supabase SQL Editor.
-- =============================================
