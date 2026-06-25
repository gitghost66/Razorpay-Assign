'use strict';

const pool = require('../db/index');

const VALID_ROLES = ['EMP', 'RM', 'APE', 'CFO'];

/**
 * Assign a role to a user. Only CFO may call this.
 */
async function assignRole({ userId, role }) {
  if (!userId || !role) {
    const err = new Error('userId and role are required.');
    err.statusCode = 400;
    throw err;
  }

  if (!VALID_ROLES.includes(role)) {
    const err = new Error(
      `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.`
    );
    err.statusCode = 400;
    throw err;
  }

  const existing = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [userId]
  );

  if (existing.rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2',
    [role, userId]
  );

  return { userId: Number(userId), role };
}

module.exports = { assignRole };
