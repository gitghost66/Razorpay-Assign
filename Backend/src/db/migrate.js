'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./index');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');

  // Read all SQL files sorted by filename (001_, 002_, ...)
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (sqlFiles.length === 0) {
    console.log('[MIGRATE] No SQL migration files found.');
    process.exit(0);
  }

  const client = await pool.connect();

  try {
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`[MIGRATE] Running: ${file}`);
      await client.query(sql);
      console.log(`[MIGRATE] Done:    ${file}`);
    }

    console.log('[MIGRATE] All migrations completed successfully.');
  } catch (err) {
    console.error('[MIGRATE] Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
