-- Migration 002: Create employee_manager mapping table

CREATE TABLE IF NOT EXISTS employee_manager (
  emp_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rm_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (emp_id, rm_id)
);
