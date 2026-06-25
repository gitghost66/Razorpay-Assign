-- Migration 003: Create reimbursements table

CREATE TABLE IF NOT EXISTS reimbursements (
  id           SERIAL PRIMARY KEY,
  emp_id       INTEGER NOT NULL REFERENCES users(id),
  title        VARCHAR(500) NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(12, 2) NOT NULL,
  rm_approved  BOOLEAN DEFAULT FALSE,
  ape_approved BOOLEAN DEFAULT FALSE,
  status       VARCHAR(10) DEFAULT 'PENDING',
  created_at   TIMESTAMP DEFAULT NOW()
);
