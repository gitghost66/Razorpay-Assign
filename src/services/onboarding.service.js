'use strict';

const bcrypt = require('bcrypt');
const pool = require('../db/index');

const SALT_ROUNDS = 10;
const VALID_DOMAIN = '@org.com';

/**
 * Validates that the email ends with @org.com
 */
function validateOrgEmail(email) {
  if (!email || !email.endsWith(VALID_DOMAIN)) {
    const err = new Error('Email must belong to the @org.com domain.');
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Register a new employee.
 * Only accepts @org.com emails; role is always set to EMP.
 */
async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    const err = new Error('name, email, and password are required.');
    err.statusCode = 400;
    throw err;
  }

  validateOrgEmail(email);

  // Check for duplicate email
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'EMP')
     RETURNING id, name, email, role`,
    [name, email, hashedPassword]
  );

  const user = result.rows[0];
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Login: validates credentials, returns user info for session creation.
 */
async function loginUser({ email, password }) {
  if (!email || !password) {
    const err = new Error('email and password are required.');
    err.statusCode = 400;
    throw err;
  }

  validateOrgEmail(email);

  const result = await pool.query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

module.exports = { registerUser, loginUser };
