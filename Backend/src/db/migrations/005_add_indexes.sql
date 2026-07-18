-- Migration 005: Add indexes on the columns actually filtered/joined on
-- (previously only primary keys / unique constraints were indexed).

-- reimbursements.service.js: WHERE emp_id = $1 (EMP dashboard, employee_manager join)
CREATE INDEX IF NOT EXISTS idx_reimbursements_emp_id ON reimbursements(emp_id);

-- reimbursements.service.js: RM/APE visibility filters on rm_approved / ape_approved / status
CREATE INDEX IF NOT EXISTS idx_reimbursements_approval_lookup
  ON reimbursements(rm_approved, ape_approved, status);

-- employees.service.js / reimbursements.service.js: WHERE rm_id = $1
-- (the (emp_id, rm_id) primary key doesn't help lookups keyed on rm_id alone)
CREATE INDEX IF NOT EXISTS idx_employee_manager_rm_id ON employee_manager(rm_id);

-- audit trail lookups by reimbursement
CREATE INDEX IF NOT EXISTS idx_reimbursement_approvals_reimb_id
  ON reimbursement_approvals(reimbursement_id);
