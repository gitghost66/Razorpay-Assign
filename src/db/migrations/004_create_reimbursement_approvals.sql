-- Migration 004: Create reimbursement_approvals audit table

CREATE TABLE IF NOT EXISTS reimbursement_approvals (
  id                 SERIAL PRIMARY KEY,
  reimbursement_id   INTEGER NOT NULL REFERENCES reimbursements(id) ON DELETE CASCADE,
  approved_by        INTEGER NOT NULL REFERENCES users(id),
  approver_role      VARCHAR(10) NOT NULL,
  action             VARCHAR(10) NOT NULL,   -- APPROVED | REJECTED
  created_at         TIMESTAMP DEFAULT NOW()
);
