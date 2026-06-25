'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../index');

async function seedCFO() {
  const email = 'cfo@org.com';
  const plainPassword = 'CFO#ORG@April2026';
  const name = 'CFO';
  const role = 'CFO';

  try {
    // Check if CFO already exists to make seed idempotent
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('[SEED] CFO account already exists. Skipping.');
      process.exit(0);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
    );

    const cfo = result.rows[0];
    console.log('[SEED] CFO account created successfully:');
    console.log(`       id:    ${cfo.id}`);
    console.log(`       name:  ${cfo.name}`);
    console.log(`       email: ${cfo.email}`);
    console.log(`       role:  ${cfo.role}`);
  } catch (err) {
    console.error('[SEED] Failed to seed CFO:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedCFO();
