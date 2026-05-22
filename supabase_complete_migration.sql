-- ================================================================
-- NUTRIMETH ERP — COMPLETE ENTERPRISE SQL MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / DROP POLICY IF EXISTS)
-- ================================================================

-- ── 1. Extend user_profiles ──────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee'
    CHECK (role IN ('super_admin','admin','manager','hr','accountant',
                    'inventory_manager','sales_manager','employee')),
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS base_salary NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 2. Departments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id  UUID REFERENCES user_profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Shifts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  break_mins  INTEGER DEFAULT 60,
  days        TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Payroll Rules (single config row) ─────────────────────────
CREATE TABLE IF NOT EXISTS payroll_rules (
  id                           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  office_start_time            TIME DEFAULT '09:00',
  grace_period_minutes         INTEGER DEFAULT 15,
  late_deduction_per_minute    NUMERIC(8,2) DEFAULT 20,
  half_day_threshold_minutes   INTEGER DEFAULT 120,
  overtime_rate_multiplier     NUMERIC(4,2) DEFAULT 1.5,
  work_hours_per_day           NUMERIC(4,2) DEFAULT 9,
  tax_rate_percent             NUMERIC(5,2) DEFAULT 0,
  updated_at                   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Office Locations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS office_locations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  city           TEXT,
  lat            DOUBLE PRECISION NOT NULL,
  lng            DOUBLE PRECISION NOT NULL,
  radius_meters  INTEGER DEFAULT 200,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Attendance ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  check_in        TIMESTAMPTZ,
  check_out       TIMESTAMPTZ,
  status          TEXT DEFAULT 'present'
                    CHECK (status IN ('present','late','absent','leave','half_day')),
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  office_id       UUID REFERENCES office_locations(id),
  office_name     TEXT,
  hours_worked    NUMERIC(5,2),
  overtime_hours  NUMERIC(5,2) DEFAULT 0,
  late_minutes    INTEGER DEFAULT 0,
  late_deduction  NUMERIC(10,2) DEFAULT 0,
  device_info     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date      ON attendance(date);

-- ── 7. Leave Requests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  leave_type   TEXT NOT NULL,
  from_date    DATE NOT NULL,
  to_date      DATE NOT NULL,
  days         INTEGER NOT NULL,
  reason       TEXT,
  status       TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  approved_by  UUID REFERENCES user_profiles(id),
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leaves_user   ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leave_requests(status);

-- ── 8. Payroll ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  year                    INTEGER NOT NULL,
  month                   INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  base_salary             NUMERIC(14,2) DEFAULT 0,
  working_days            INTEGER DEFAULT 0,
  present_days            INTEGER DEFAULT 0,
  absent_days             INTEGER DEFAULT 0,
  late_minutes            INTEGER DEFAULT 0,
  late_deduction          NUMERIC(12,2) DEFAULT 0,
  absent_deduction        NUMERIC(12,2) DEFAULT 0,
  unpaid_leave_days       INTEGER DEFAULT 0,
  unpaid_leave_deduction  NUMERIC(12,2) DEFAULT 0,
  overtime_hours          NUMERIC(6,2) DEFAULT 0,
  overtime_pay            NUMERIC(12,2) DEFAULT 0,
  bonus                   NUMERIC(12,2) DEFAULT 0,
  advance_deduction       NUMERIC(12,2) DEFAULT 0,
  tax_deduction           NUMERIC(12,2) DEFAULT 0,
  total_deductions        NUMERIC(12,2) DEFAULT 0,
  net_salary              NUMERIC(14,2) DEFAULT 0,
  status                  TEXT DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','paid')),
  paid_at                 TIMESTAMPTZ,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);
CREATE INDEX IF NOT EXISTS idx_payroll_user  ON payroll(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(year, month);

-- ── 9. Tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  assigned_to  UUID REFERENCES user_profiles(id),
  assigned_by  UUID REFERENCES user_profiles(id),
  priority     TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status       TEXT DEFAULT 'todo'   CHECK (status IN ('todo','in_progress','done')),
  due_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);

-- ── 10. Employee Documents ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_documents (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL,
  description  TEXT,
  file_url     TEXT NOT NULL,
  file_name    TEXT,
  file_size    INTEGER,
  status       TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','verified')),
  admin_notes  TEXT,
  reviewed_by  UUID REFERENCES user_profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_user ON employee_documents(user_id);

-- ── 11. Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT,
  type       TEXT DEFAULT 'info'
               CHECK (type IN ('info','warning','error','success')),
  read       BOOLEAN DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(read);

-- ── 12. Activity Logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES user_profiles(id),
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logs_user   ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);

-- ── 13. Stock Logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID,
  user_id     UUID REFERENCES user_profiles(id),
  action      TEXT NOT NULL CHECK (action IN ('in','out','adjustment','transfer')),
  qty_before  NUMERIC(12,2),
  qty_change  NUMERIC(12,2) NOT NULL,
  qty_after   NUMERIC(12,2),
  reference   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stocklogs_product ON stock_logs(product_id);

-- ── 14. Warehouses ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  location     TEXT,
  city         TEXT,
  capacity     INTEGER DEFAULT 10000,
  manager_id   UUID REFERENCES user_profiles(id),
  phone        TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 15. Enable Realtime on new tables ────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE payroll;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE employee_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE office_locations;

-- ── 16. Enable RLS ────────────────────────────────────────────────
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs          ENABLE ROW LEVEL SECURITY;

-- ── Helper: is_privileged() ───────────────────────────────────────
CREATE OR REPLACE FUNCTION is_privileged()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin','admin','hr','manager')
  );
$$;

-- ── 17. RLS Policies ─────────────────────────────────────────────

-- attendance
DROP POLICY IF EXISTS "att_select"  ON attendance;
DROP POLICY IF EXISTS "att_insert"  ON attendance;
DROP POLICY IF EXISTS "att_update"  ON attendance;

CREATE POLICY "att_select" ON attendance FOR SELECT
  USING (user_id = auth.uid() OR is_privileged());
CREATE POLICY "att_insert" ON attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "att_update" ON attendance FOR UPDATE
  USING (user_id = auth.uid() OR is_privileged());

-- leave_requests
DROP POLICY IF EXISTS "lr_select"  ON leave_requests;
DROP POLICY IF EXISTS "lr_insert"  ON leave_requests;
DROP POLICY IF EXISTS "lr_update"  ON leave_requests;
DROP POLICY IF EXISTS "lr_delete"  ON leave_requests;

CREATE POLICY "lr_select" ON leave_requests FOR SELECT
  USING (user_id = auth.uid() OR is_privileged());
CREATE POLICY "lr_insert" ON leave_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "lr_update" ON leave_requests FOR UPDATE
  USING (is_privileged());
CREATE POLICY "lr_delete" ON leave_requests FOR DELETE
  USING (is_privileged());

-- tasks
DROP POLICY IF EXISTS "task_select" ON tasks;
DROP POLICY IF EXISTS "task_insert" ON tasks;
DROP POLICY IF EXISTS "task_update" ON tasks;
DROP POLICY IF EXISTS "task_delete" ON tasks;

CREATE POLICY "task_select" ON tasks FOR SELECT
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid() OR is_privileged());
CREATE POLICY "task_insert" ON tasks FOR INSERT
  WITH CHECK (assigned_by = auth.uid() OR is_privileged());
CREATE POLICY "task_update" ON tasks FOR UPDATE
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid() OR is_privileged());
CREATE POLICY "task_delete" ON tasks FOR DELETE
  USING (assigned_by = auth.uid() OR is_privileged());

-- payroll
DROP POLICY IF EXISTS "pay_select" ON payroll;
DROP POLICY IF EXISTS "pay_insert" ON payroll;
DROP POLICY IF EXISTS "pay_update" ON payroll;

CREATE POLICY "pay_select" ON payroll FOR SELECT
  USING (user_id = auth.uid() OR is_privileged() OR
         EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()
                 AND role IN ('accountant','super_admin')));
CREATE POLICY "pay_insert" ON payroll FOR INSERT
  WITH CHECK (is_privileged());
CREATE POLICY "pay_update" ON payroll FOR UPDATE
  USING (is_privileged());

-- notifications
DROP POLICY IF EXISTS "notif_select" ON notifications;
DROP POLICY IF EXISTS "notif_update" ON notifications;
DROP POLICY IF EXISTS "notif_insert" ON notifications;

CREATE POLICY "notif_select" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "notif_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid() OR is_privileged());
CREATE POLICY "notif_insert" ON notifications FOR INSERT
  WITH CHECK (is_privileged() OR auth.uid() IS NOT NULL);

-- employee_documents
DROP POLICY IF EXISTS "doc_select" ON employee_documents;
DROP POLICY IF EXISTS "doc_insert" ON employee_documents;
DROP POLICY IF EXISTS "doc_update" ON employee_documents;

CREATE POLICY "doc_select" ON employee_documents FOR SELECT
  USING (user_id = auth.uid() OR is_privileged());
CREATE POLICY "doc_insert" ON employee_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "doc_update" ON employee_documents FOR UPDATE
  USING (is_privileged());

-- office_locations
DROP POLICY IF EXISTS "ol_select" ON office_locations;
DROP POLICY IF EXISTS "ol_all"    ON office_locations;

CREATE POLICY "ol_select" ON office_locations FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "ol_all" ON office_locations FOR ALL
  USING (is_privileged());

-- activity_logs, payroll_rules, departments, warehouses, stock_logs
DROP POLICY IF EXISTS "al_select"  ON activity_logs;
DROP POLICY IF EXISTS "al_insert"  ON activity_logs;
DROP POLICY IF EXISTS "pr_all"     ON payroll_rules;
DROP POLICY IF EXISTS "dept_all"   ON departments;
DROP POLICY IF EXISTS "dept_sel"   ON departments;
DROP POLICY IF EXISTS "wh_all"     ON warehouses;
DROP POLICY IF EXISTS "wh_sel"     ON warehouses;
DROP POLICY IF EXISTS "sl_select"  ON stock_logs;
DROP POLICY IF EXISTS "sl_insert"  ON stock_logs;

CREATE POLICY "al_select"  ON activity_logs FOR SELECT USING (is_privileged());
CREATE POLICY "al_insert"  ON activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "pr_all"     ON payroll_rules FOR ALL USING (is_privileged());
CREATE POLICY "dept_sel"   ON departments   FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "dept_all"   ON departments   FOR ALL    USING (is_privileged());
CREATE POLICY "wh_sel"     ON warehouses    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "wh_all"     ON warehouses    FOR ALL    USING (is_privileged());
CREATE POLICY "sl_select"  ON stock_logs    FOR SELECT USING (is_privileged());
CREATE POLICY "sl_insert"  ON stock_logs    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── 18. Supabase Storage buckets ──────────────────────────────────
-- Run in SQL Editor (bucket creation requires Storage API in practice)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false) ON CONFLICT DO NOTHING;

-- ── 19. Promote first registered user to super_admin ─────────────
-- IMPORTANT: Replace with your actual admin email before running
-- UPDATE user_profiles SET role = 'super_admin', base_salary = 0
-- WHERE email = 'your-superadmin@email.com';

-- ── Seed default payroll rules ────────────────────────────────────
INSERT INTO payroll_rules (
  office_start_time, grace_period_minutes, late_deduction_per_minute,
  half_day_threshold_minutes, overtime_rate_multiplier, work_hours_per_day, tax_rate_percent
) SELECT '09:00', 15, 20, 120, 1.5, 9, 0
  WHERE NOT EXISTS (SELECT 1 FROM payroll_rules);

-- ── Seed default departments ──────────────────────────────────────
INSERT INTO departments (name) VALUES
  ('Sales'), ('HR'), ('Finance'), ('Operations'),
  ('Inventory'), ('IT'), ('Management')
  ON CONFLICT (name) DO NOTHING;

SELECT 'Migration complete ✓' AS result;
