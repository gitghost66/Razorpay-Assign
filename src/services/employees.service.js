'use strict';

const pool = require('../db/index');

/**
 * Get the list of employees visible to the requesting user.
 * Visibility rules:
 *   RM  → EMPs assigned to them via employee_manager
 *   APE → all users with role EMP or RM
 *   CFO → all users except other CFOs
 */
async function getEmployees({ userId, role }) {
  let result;

  if (role === 'RM') {
    result = await pool.query(
      `SELECT u.id AS "userId", u.name, u.email, u.role
       FROM users u
       INNER JOIN employee_manager em ON em.emp_id = u.id
       WHERE em.rm_id = $1
         AND u.role = 'EMP'`,
      [userId]
    );
  } else if (role === 'APE') {
    result = await pool.query(
      `SELECT id AS "userId", name, email, role
       FROM users
       WHERE role IN ('EMP', 'RM')`
    );
  } else if (role === 'CFO') {
    result = await pool.query(
      `SELECT id AS "userId", name, email, role
       FROM users
       WHERE role != 'CFO'`
    );
  } else {
    const err = new Error('Forbidden: You do not have permission to view employees.');
    err.statusCode = 403;
    throw err;
  }

  return result.rows;
}

/**
 * Assign an employee to a reporting manager (CFO only).
 * empId must have role EMP, rmId must have role RM.
 */
async function assignEmployee({ empId, rmId }) {
  if (!empId || !rmId) {
    const err = new Error('empId and rmId are required.');
    err.statusCode = 400;
    throw err;
  }

  // Validate employee
  const empResult = await pool.query(
    'SELECT id, role FROM users WHERE id = $1',
    [empId]
  );
  if (empResult.rows.length === 0) {
    const err = new Error('Employee user not found.');
    err.statusCode = 404;
    throw err;
  }
  if (empResult.rows[0].role !== 'EMP') {
    const err = new Error('The provided empId does not belong to a user with role EMP.');
    err.statusCode = 400;
    throw err;
  }

  // Validate reporting manager
  const rmResult = await pool.query(
    'SELECT id, role FROM users WHERE id = $1',
    [rmId]
  );
  if (rmResult.rows.length === 0) {
    const err = new Error('Reporting manager user not found.');
    err.statusCode = 404;
    throw err;
  }
  if (rmResult.rows[0].role !== 'RM') {
    const err = new Error('The provided rmId does not belong to a user with role RM.');
    err.statusCode = 400;
    throw err;
  }

  // Upsert to avoid duplicate key error
  await pool.query(
    `INSERT INTO employee_manager (emp_id, rm_id)
     VALUES ($1, $2)
     ON CONFLICT (emp_id, rm_id) DO NOTHING`,
    [empId, rmId]
  );
}

/**
 * Remove an employee-manager assignment (CFO only).
 */
async function unassignEmployee({ empId, rmId }) {
  if (!empId || !rmId) {
    const err = new Error('empId and rmId are required.');
    err.statusCode = 400;
    throw err;
  }

  const result = await pool.query(
    'DELETE FROM employee_manager WHERE emp_id = $1 AND rm_id = $2 RETURNING emp_id',
    [empId, rmId]
  );

  if (result.rowCount === 0) {
    const err = new Error('No such employee-manager assignment found.');
    err.statusCode = 404;
    throw err;
  }
}

module.exports = { getEmployees, assignEmployee, unassignEmployee };
