-- Migration: 0001_initial_schema.sql
-- Description: Initial schema for Smart Kids school ERP

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent',
  phone TEXT,
  student_id TEXT,
  avatar TEXT DEFAULT '👨‍💼',
  status TEXT DEFAULT 'Active',
  email_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dob TEXT,
  age TEXT,
  class TEXT NOT NULL DEFAULT 'Nursery',
  section TEXT DEFAULT 'A',
  roll_no TEXT,
  blood_group TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  address TEXT,
  admission_date TEXT,
  avatar TEXT DEFAULT '🧒',
  attendance_percent REAL DEFAULT 100.0,
  fee_status TEXT DEFAULT 'Unassigned',
  fee_due INTEGER DEFAULT 0,
  term TEXT DEFAULT '2026-27',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_cards (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  term TEXT NOT NULL,
  academic_year TEXT DEFAULT '2026-27',
  grades_json TEXT NOT NULL,
  teacher_remarks TEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  receipt_no TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  class TEXT NOT NULL,
  amount INTEGER NOT NULL,
  fee_type TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Razorpay Gateway',
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'Success',
  date TEXT NOT NULL,
  collected_by TEXT DEFAULT 'Online Gateway',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admissions (
  id TEXT PRIMARY KEY,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  child_name TEXT NOT NULL,
  child_dob TEXT NOT NULL,
  program TEXT NOT NULL,
  academic_year TEXT DEFAULT '2026-27',
  status TEXT DEFAULT 'Under Review',
  notes TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  urgent INTEGER DEFAULT 0,
  author TEXT DEFAULT "Principal's Desk",
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial Admins
INSERT OR IGNORE INTO users (id, name, username, email, password, role, avatar, status, email_verified)
VALUES 
  ('usr-admin-01', 'Mrs. Manisha Bhume (Principal & Director)', 'Manisha', 'manisha@smartkids.edu', 'Manisha123', 'admin', '👩‍🏫', 'Active', 1),
  ('usr-admin-02', 'Hardik Biradar (System Admin)', 'Hardik', 'hardik@smartkids.edu', 'hardik', 'admin', '👨‍💼', 'Active', 1);

INSERT OR IGNORE INTO announcements (id, title, category, date, content, urgent, author)
VALUES 
  ('ANN-001', 'Admissions Open for Academic Session 2026-27', 'Admissions', '2026-08-01', 'Admissions are now open for Playgroup, Nursery, Junior KG, Senior KG & Daycare. Applications can be submitted online.', 0, "Principal's Desk");

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON students(parent_email);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_admissions_parent_email ON admissions(parent_email);
CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps(email, purpose);
