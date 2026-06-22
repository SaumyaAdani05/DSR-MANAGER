-- DSR Manager — Production Database Schema Setup Script
-- Execute this script in the Supabase SQL Editor to secure your project.

-- ========================================================
-- 1. DROP OBSOLETE PRIVILEGES AND REMOTE EXECUTION FUNCTIONS
-- ========================================================
DROP FUNCTION IF EXISTS exec_sql(TEXT);

-- ========================================================
-- 2. CREATE SCHEMAS AND DEFINE STRUCTURAL CONSTRAINTS
-- ========================================================

-- Settings Table (per station config)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT NOT NULL DEFAULT 'main',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_name VARCHAR(100) NOT NULL DEFAULT 'Memnagar CNG',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- Nozzles Table
CREATE TABLE IF NOT EXISTS public.nozzles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts Table (Main Daily Record)
CREATE TABLE IF NOT EXISTS public.shifts (
  date VARCHAR(10) NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  shift_number INTEGER NOT NULL CHECK (shift_number IN (1, 2, 3)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  rows JSONB NOT NULL DEFAULT '[]',
  totals JSONB NOT NULL DEFAULT '{}',
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, shift_number, user_id)
);

-- Calendar Table (Metadata for dots)
CREATE TABLE IF NOT EXISTS public.calendar (
  date VARCHAR(10) NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_data BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, user_id)
);

-- Audit Logs Table (Tamper-proof backend audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nozzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 4. CREATE OWNER-ISOLATION POLICIES (auth.uid() = user_id)
-- ========================================================

-- Settings
DROP POLICY IF EXISTS "Users can only access their own settings" ON public.settings;
CREATE POLICY "Users can only access their own settings" ON public.settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Nozzles
DROP POLICY IF EXISTS "Users can only access their own nozzles" ON public.nozzles;
CREATE POLICY "Users can only access their own nozzles" ON public.nozzles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Employees
DROP POLICY IF EXISTS "Users can only access their own employees" ON public.employees;
CREATE POLICY "Users can only access their own employees" ON public.employees
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shifts
DROP POLICY IF EXISTS "Users can only access their own shifts" ON public.shifts;
CREATE POLICY "Users can only access their own shifts" ON public.shifts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Calendar
DROP POLICY IF EXISTS "Users can only access their own calendar" ON public.calendar;
CREATE POLICY "Users can only access their own calendar" ON public.calendar
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Audit Logs (Read only policy for owners; write handled via system trigger)
DROP POLICY IF EXISTS "Users can only read their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can only read their own audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- 5. SERVER-SIDE VALIDATION TRIGGERS (SHIFTS & FIELDS)
-- ========================================================

CREATE OR REPLACE FUNCTION public.validate_shift_data()
RETURNS TRIGGER AS $$
DECLARE
  row_item JSONB;
  rows_array JSONB;
  row_count INTEGER;
  opening_reading NUMERIC;
  closing_reading NUMERIC;
  sales_rs NUMERIC;
  cash NUMERIC;
  cc NUMERIC;
  upi NUMERIC;
  cash_party NUMERIC;
  total_payment NUMERIC;
  price_val NUMERIC;
BEGIN
  -- Validate rows is a JSONB array
  IF jsonb_typeof(NEW.rows) <> 'array' THEN
    RAISE EXCEPTION 'Rows column must be a valid JSONB array';
  END IF;

  rows_array := NEW.rows;
  row_count := jsonb_array_length(rows_array);

  -- Validate maximum 15 rows
  IF row_count > 15 THEN
    RAISE EXCEPTION 'A shift cannot exceed 15 nozzle rows. Found: %', row_count;
  END IF;

  price_val := NEW.price;

  -- Validate each row's fields and reconciliation rules
  FOR i IN 0..(row_count - 1) LOOP
    row_item := jsonb_extract_path(rows_array, i::text);

    opening_reading := (row_item->>'openingReading')::numeric;
    closing_reading := (row_item->>'closingReading')::numeric;
    sales_rs := (row_item->>'salesRs')::numeric;
    cash := COALESCE((row_item->>'cash')::numeric, 0);
    cc := COALESCE((row_item->>'cc')::numeric, 0);
    upi := COALESCE((row_item->>'upi')::numeric, 0);
    cash_party := COALESCE((row_item->>'cashParty')::numeric, 0);

    -- Check limits/boundaries
    IF opening_reading <= 0 THEN
      RAISE EXCEPTION 'Row %: Opening reading must be greater than 0.', i + 1;
    END IF;

    IF closing_reading < opening_reading THEN
      RAISE EXCEPTION 'Row %: Closing reading (%) cannot be less than opening reading (%).', i + 1, closing_reading, opening_reading;
    END IF;

    IF cash < 0 OR cc < 0 OR upi < 0 OR cash_party < 0 THEN
      RAISE EXCEPTION 'Row %: Payments cannot be negative values.', i + 1;
    END IF;

    -- Verify math reconciliation
    total_payment := cash + cc + upi + cash_party;
    IF ABS(total_payment - sales_rs) > 0.02 THEN
      RAISE EXCEPTION 'Row %: Reconciliation failed. Cash + CC + UPI + Cash Party (%) != Sales (%)', i + 1, total_payment, sales_rs;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_shift ON public.shifts;
CREATE TRIGGER trigger_validate_shift
  BEFORE INSERT OR UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.validate_shift_data();

-- ========================================================
-- 6. AUTOMATIC BACKEND AUDIT LOGGING TRIGGERS
-- ========================================================

CREATE OR REPLACE FUNCTION public.process_audit_logging()
RETURNS TRIGGER AS $$
DECLARE
  old_val JSONB := NULL;
  new_val JSONB := NULL;
  uid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_val := to_jsonb(OLD);
    uid := OLD.user_id;
  ELSE
    new_val := to_jsonb(NEW);
    uid := NEW.user_id;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    old_val := to_jsonb(OLD);
  END IF;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    uid,
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_TABLE_NAME = 'shifts' THEN (COALESCE(new_val->>'date', old_val->>'date') || '_' || COALESCE(new_val->>'shift_number', old_val->>'shift_number'))
      WHEN TG_TABLE_NAME = 'calendar' THEN COALESCE(new_val->>'date', old_val->>'date')
      ELSE COALESCE(new_val->>'id', old_val->>'id')
    END,
    old_val,
    new_val
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Hook auditing to primary tables
DROP TRIGGER IF EXISTS audit_shifts ON public.shifts;
CREATE TRIGGER audit_shifts
  AFTER INSERT OR UPDATE OR DELETE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_nozzles ON public.nozzles;
CREATE TRIGGER audit_nozzles
  AFTER INSERT OR UPDATE OR DELETE ON public.nozzles
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_settings ON public.settings;
CREATE TRIGGER audit_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

-- ========================================================
-- 7. NEW V2 TABLES (PARTIES, BILLS, ATTENDANCE, ADVANCES, SALARY, AUTH)
-- ========================================================

-- Parties Table (for Cash Party selection)
CREATE TABLE IF NOT EXISTS public.parties (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER NOT NULL CHECK (display_order >= 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Party Entries Table
CREATE TABLE IF NOT EXISTS public.cash_party_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  shift_number INTEGER NOT NULL CHECK (shift_number IN (1, 2, 3)),
  row_index INTEGER NOT NULL CHECK (row_index >= 0 AND row_index < 15),
  party_id TEXT NOT NULL,
  party_name VARCHAR(100) NOT NULL,
  diff_kg DECIMAL(10,2) NOT NULL,
  sales_rs DECIMAL(10,2) NOT NULL,
  cash_party_amount DECIMAL(10,2) NOT NULL CHECK (cash_party_amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  amount_paid DECIMAL(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
  payment_date TIMESTAMPTZ,
  bill_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Settings Table
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  id TEXT NOT NULL DEFAULT 'main',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  per_shift_wage DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (per_shift_wage >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  date VARCHAR(10) NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  shift_number INTEGER NOT NULL CHECK (shift_number IN (1, 2, 3)),
  employee_id TEXT NOT NULL,
  employee_name VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, shift_number, employee_id, user_id)
);

-- Advances Table
CREATE TABLE IF NOT EXISTS public.advances (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  date VARCHAR(10) NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Payments Table
CREATE TABLE IF NOT EXISTS public.salary_payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_name VARCHAR(100) NOT NULL,
  period_start VARCHAR(10) NOT NULL CHECK (period_start ~ '^\d{4}-\d{2}-\d{2}$'),
  period_end VARCHAR(10) NOT NULL CHECK (period_end ~ '^\d{4}-\d{2}-\d{2}$'),
  total_shifts INTEGER NOT NULL DEFAULT 0 CHECK (total_shifts >= 0),
  total_wage DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_wage >= 0),
  advance_given DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (advance_given >= 0),
  deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (deduction_amount >= 0),
  net_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'remaining' CHECK (status IN ('remaining', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill Counter Table
CREATE TABLE IF NOT EXISTS public.bill_counter (
  id TEXT NOT NULL DEFAULT 'main',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- Auth Table (Local Auth Backup)
CREATE TABLE IF NOT EXISTS public.auth (
  id TEXT NOT NULL DEFAULT 'owner',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  security_question TEXT DEFAULT '',
  security_answer_hash TEXT DEFAULT '',
  is_first_login BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- Enable RLS on New Tables
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_party_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth ENABLE ROW LEVEL SECURITY;

-- Owner-Isolation Policies for New Tables
DROP POLICY IF EXISTS "Users can only access their own parties" ON public.parties;
CREATE POLICY "Users can only access their own parties" ON public.parties
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own cash_party_entries" ON public.cash_party_entries;
CREATE POLICY "Users can only access their own cash_party_entries" ON public.cash_party_entries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own attendance_settings" ON public.attendance_settings;
CREATE POLICY "Users can only access their own attendance_settings" ON public.attendance_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own attendance" ON public.attendance;
CREATE POLICY "Users can only access their own attendance" ON public.attendance
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own advances" ON public.advances;
CREATE POLICY "Users can only access their own advances" ON public.advances
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own salary_payments" ON public.salary_payments;
CREATE POLICY "Users can only access their own salary_payments" ON public.salary_payments
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own bill_counter" ON public.bill_counter;
CREATE POLICY "Users can only access their own bill_counter" ON public.bill_counter
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own auth settings" ON public.auth;
CREATE POLICY "Users can only access their own auth settings" ON public.auth
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hook Auditing to New Tables
DROP TRIGGER IF EXISTS audit_parties ON public.parties;
CREATE TRIGGER audit_parties
  AFTER INSERT OR UPDATE OR DELETE ON public.parties
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_cash_party_entries ON public.cash_party_entries;
CREATE TRIGGER audit_cash_party_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_party_entries
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_attendance_settings ON public.attendance_settings;
CREATE TRIGGER audit_attendance_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance_settings
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_attendance ON public.attendance;
CREATE TRIGGER audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_advances ON public.advances;
CREATE TRIGGER audit_advances
  AFTER INSERT OR UPDATE OR DELETE ON public.advances
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_salary_payments ON public.salary_payments;
CREATE TRIGGER audit_salary_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_bill_counter ON public.bill_counter;
CREATE TRIGGER audit_bill_counter
  AFTER INSERT OR UPDATE OR DELETE ON public.bill_counter
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

DROP TRIGGER IF EXISTS audit_auth ON public.auth;
CREATE TRIGGER audit_auth
  AFTER INSERT OR UPDATE OR DELETE ON public.auth
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

-- ========================================================
-- 6. DAILY RECORDS TABLE SETUP (EXPENSES & CMS)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.daily_records (
  date VARCHAR(10) NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expenses JSONB NOT NULL DEFAULT '[]',
  cms DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cms >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, user_id)
);

ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own daily records" ON public.daily_records;
CREATE POLICY "Users can only access their own daily records" ON public.daily_records
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS audit_daily_records ON public.daily_records;
CREATE TRIGGER audit_daily_records
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_records
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

