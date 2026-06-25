
'use strict';

require('dotenv').config();
const { Pool } = require('pg');

// Support both a single DATABASE_URL and individual DB_* variables.
// DATABASE_URL takes priority when present.
// Supabase (and most cloud PG providers) require SSL — enabled automatically
// when DATABASE_URL is set.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required for Supabase / cloud PG
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(1);
});

module.exports = pool;
