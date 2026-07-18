'use strict';

const pool = require('../db/index');

/**
 * Submit a new reimbursement request (EMP only).
 */
async function createReimbursement({ empId, title, description, amount }) {
  if (!title || !description || amount === undefined || amount === null) {
    const err = new Error('title, description, and amount are required.');
    err.statusCode = 400;
    throw err;
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    const err = new Error('amount must be a positive number.');
    err.statusCode = 400;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO reimbursements (emp_id, title, description, amount, status, rm_approved, ape_approved)
     VALUES ($1, $2, $3, $4, 'PENDING', FALSE, FALSE)
     RETURNING id, title, description, amount, status`,
    [empId, title, description, amount]
  );

  const r = result.rows[0];
  return {
    reimbursementId: r.id,
    title: r.title,
    description: r.description,
    amount: r.amount,
    status: r.status,
  };
}

/**
 * Update the approval/rejection status of a reimbursement.
 * Business logic varies by the actor's role.
 *
 * Runs as a single transaction so the status change and its audit-log entry
 * either both land or neither does (a crash between two separate queries
 * previously could have left an approval with no audit record).
 */
async function updateReimbursementStatus({ reimbursementId, status, userId, role }) {
  if (!reimbursementId || !status) {
    const err = new Error('reimbursementId and status are required.');
    err.statusCode = 400;
    throw err;
  }

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    const err = new Error('status must be APPROVED or REJECTED.');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch the reimbursement
    const rResult = await client.query(
      'SELECT * FROM reimbursements WHERE id = $1',
      [reimbursementId]
    );

    if (rResult.rows.length === 0) {
      const err = new Error('Reimbursement not found.');
      err.statusCode = 404;
      throw err;
    }

    const reimb = rResult.rows[0];
    let updateResult;

    if (role === 'RM') {
      // RM can only act on reimbursements belonging to their own EMPs
      const empCheck = await client.query(
        'SELECT 1 FROM employee_manager WHERE emp_id = $1 AND rm_id = $2',
        [reimb.emp_id, userId]
      );

      if (empCheck.rows.length === 0) {
        const err = new Error('Forbidden: This reimbursement does not belong to your team.');
        err.statusCode = 403;
        throw err;
      }

      updateResult = status === 'REJECTED'
        ? await client.query(
            "UPDATE reimbursements SET status = 'REJECTED' WHERE id = $1 RETURNING id, status",
            [reimbursementId]
          )
        : await client.query(
            `UPDATE reimbursements
             SET rm_approved = TRUE,
                 status = CASE WHEN ape_approved = TRUE THEN 'APPROVED' ELSE status END
             WHERE id = $1
             RETURNING id, status`,
            [reimbursementId]
          );
    } else if (role === 'APE') {
      // APE can only act on reimbursements where rm_approved = true and not already rejected
      if (!reimb.rm_approved) {
        const err = new Error('Forbidden: This reimbursement has not been approved by the RM yet.');
        err.statusCode = 403;
        throw err;
      }
      if (reimb.status === 'REJECTED') {
        const err = new Error('Forbidden: This reimbursement has already been rejected.');
        err.statusCode = 403;
        throw err;
      }

      updateResult = status === 'REJECTED'
        ? await client.query(
            "UPDATE reimbursements SET status = 'REJECTED' WHERE id = $1 RETURNING id, status",
            [reimbursementId]
          )
        : await client.query(
            `UPDATE reimbursements
             SET ape_approved = TRUE,
                 status = CASE WHEN rm_approved = TRUE THEN 'APPROVED' ELSE status END
             WHERE id = $1
             RETURNING id, status`,
            [reimbursementId]
          );
    } else if (role === 'CFO') {
      // CFO can approve or reject any reimbursement
      updateResult = status === 'REJECTED'
        ? await client.query(
            "UPDATE reimbursements SET status = 'REJECTED' WHERE id = $1 RETURNING id, status",
            [reimbursementId]
          )
        : await client.query(
            `UPDATE reimbursements
             SET rm_approved = TRUE, ape_approved = TRUE, status = 'APPROVED'
             WHERE id = $1
             RETURNING id, status`,
            [reimbursementId]
          );
    } else {
      const err = new Error('Forbidden: You are not allowed to update reimbursements.');
      err.statusCode = 403;
      throw err;
    }

    // Record in audit table
    await client.query(
      `INSERT INTO reimbursement_approvals (reimbursement_id, approved_by, approver_role, action)
       VALUES ($1, $2, $3, $4)`,
      [reimbursementId, userId, role, status]
    );

    await client.query('COMMIT');

    const updatedRow = updateResult.rows[0];
    return {
      reimbursementId: updatedRow.id,
      status: updatedRow.status,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get reimbursements visible to the requesting user.
 * Visibility rules depend on role.
 */
async function getReimbursements({ userId, role }) {
  let result;

  if (role === 'EMP') {
    // EMP sees all their own reimbursements
    result = await pool.query(
      `SELECT id, title, description, amount, status
       FROM reimbursements
       WHERE emp_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
  } else if (role === 'RM') {
    // RM sees PENDING reimbursements from their EMPs where rm_approved = false
    result = await pool.query(
      `SELECT r.id, r.title, r.description, r.amount, r.status
       FROM reimbursements r
       INNER JOIN employee_manager em ON em.emp_id = r.emp_id
       WHERE em.rm_id = $1
         AND r.status = 'PENDING'
         AND r.rm_approved = FALSE
       ORDER BY r.created_at DESC`,
      [userId]
    );
  } else if (role === 'APE') {
    // APE sees reimbursements with rm_approved = true, ape_approved = false, not rejected
    result = await pool.query(
      `SELECT id, title, description, amount, status
       FROM reimbursements
       WHERE rm_approved = TRUE
         AND ape_approved = FALSE
         AND status != 'REJECTED'
       ORDER BY created_at DESC`
    );
  } else if (role === 'CFO') {
    // CFO has full pipeline visibility — sees ALL reimbursements regardless of approval state.
    // Bug was: WHERE ape_approved = TRUE — this hid every fresh PENDING claim from the CFO
    // since new claims have ape_approved=FALSE until someone in the chain approves them.
    result = await pool.query(
      `SELECT id, title, description, amount, status
       FROM reimbursements
       ORDER BY created_at DESC`
    );
  } else {
    const err = new Error('Forbidden: Unknown role.');
    err.statusCode = 403;
    throw err;
  }

  return result.rows;
}

/**
 * Get reimbursements for a specific employee (:userId).
 * Rules:
 *   - :userId must be an EMP
 *   - :userId must be a subordinate of the requester (unless requester is CFO)
 */
async function getReimbursementsByEmployee({ targetUserId, requesterId, requesterRole }) {
  // Verify target user is an EMP
  const targetResult = await pool.query(
    'SELECT id, role FROM users WHERE id = $1',
    [targetUserId]
  );

  if (targetResult.rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (targetResult.rows[0].role !== 'EMP') {
    const err = new Error('The requested user is not an Employee.');
    err.statusCode = 400;
    throw err;
  }

  // CFO can view any EMP's reimbursements freely
  if (requesterRole !== 'CFO') {
    const subordinateCheck = await pool.query(
      'SELECT 1 FROM employee_manager WHERE emp_id = $1 AND rm_id = $2',
      [targetUserId, requesterId]
    );

    if (subordinateCheck.rows.length === 0) {
      const err = new Error('Forbidden: This employee is not your subordinate.');
      err.statusCode = 403;
      throw err;
    }
  }

  const result = await pool.query(
    `SELECT id, title, description, amount, status
     FROM reimbursements
     WHERE emp_id = $1
     ORDER BY created_at DESC`,
    [targetUserId]
  );

  return result.rows;
}

module.exports = {
  createReimbursement,
  updateReimbursementStatus,
  getReimbursements,
  getReimbursementsByEmployee,
};
